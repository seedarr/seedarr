from pydantic import BaseModel, Field

import libtorrent as lt
from seedarr.datastructures import EventDataclass
from seedarr.decorators import validate_payload
from seedarr.enums import SyntheticEvent
from seedarr.singletons import SIO, EventBus, LibtorrentSession

sio = SIO.get_instance()
event_bus = EventBus.get_bus()


async def publish_resume_event(handle: lt.torrent_handle):
    """Publish a synthetic event when a torrent is resumed."""
    event = EventDataclass(
        event=SyntheticEvent.RESUMED,
        torrent=handle,
    )
    await event_bus.publish(event)


class ResumeRequestPayload(BaseModel):
    info_hash: str = Field(...)


@sio.on("libtorrent:resume")  # type: ignore
@validate_payload(ResumeRequestPayload)
async def resume(sid: str, data: ResumeRequestPayload):
    """
    Handle the 'resume' event from the client.

    Args:
        sid (str): The session ID of the client.
        data (dict): The data sent from the client.
            Expected keys:
            - info_hash (str): The hex string of the torrent's info hash.
    """
    ses = await LibtorrentSession.get_session()

    try:
        ih = lt.sha1_hash(bytes.fromhex(data.info_hash))
    except ValueError:
        return {"status": "error", "message": "Invalid info_hash format"}

    handle = ses.find_torrent(ih)
    if not handle.is_valid():
        return {"status": "error", "message": "Torrent not found"}

    if handle.is_paused():
        handle.set_upload_mode(False)  # Re-enable uploading
        handle.auto_managed(True)  # Re-enable auto management
        handle.resume()
        sio.start_background_task(publish_resume_event, handle)
        return {"status": "success", "message": "Torrent resumed and upload enabled"}

    return {"status": "info", "message": "Torrent is already active"}
