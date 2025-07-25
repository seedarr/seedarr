import anyio
import anyio.to_thread
from cross_platform_folder_picker import open_folder_picker

from seedarr.singletons import SIO

sio = SIO.get_instance()


@sio.on("bridge:pick_folder")  # type: ignore
async def pick_folder(sid: str):
    """
    Handle the 'pick_folder' event from the client.
    """

    try:
        folder_path = await anyio.to_thread.run_sync(open_folder_picker)
        if folder_path:
            return {"status": "success", "path": folder_path}
        else:
            return {"status": "cancelled", "message": "No folder selected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
