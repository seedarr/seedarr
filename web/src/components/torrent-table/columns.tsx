"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatBytes } from "@/lib/formatBytes";
import { BroadcastTorrentInfo } from "@/types/socket/torrent_info";
import { snakeToSpace } from "@/lib/snakeToSpace";
import { useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { formatDurationClean } from "@/lib/formatDurationClean";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOOLTIP_DELAY } from "@/consts/tooltip";
import { TableHeaderSortButton } from "../table-header-sort-button";

const columnsMetadata: {
    key: string;
    cell?: (context: {
        getValue: () => any;
        row: { original: BroadcastTorrentInfo };
    }) => React.ReactNode;
    keyName?: string;
}[] = [
    {
        key: "name",
        cell: ({ getValue }) => (
            <div className="flex items-center gap-2">
                <p className="pl-2">{getValue()}</p>
            </div>
        ),
    },
    {
        key: "total_size",
        keyName: "Total Size",

        cell: ({ getValue }) => (
            <div className="flex items-center justify-center gap-2">
                <span>{formatBytes({ bytes: getValue() })}</span>
            </div>
        ),
    },
    {
        key: "progress",
        cell: ({ getValue }) => {
            const progress = getValue();
            const [open, setOpen] = useState(false);
            const timerRef = useRef<number | null>(null);

            const startTimer = () => {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }
                timerRef.current = window.setTimeout(() => {
                    setOpen(true);
                }, TOOLTIP_DELAY);
            };

            const handleMouseEnter = () => {
                startTimer();
            };

            const handleMouseMove = () => {
                startTimer();
            };

            const handleMouseLeave = () => {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
                setOpen(false);
            };

            return (
                <Tooltip open={open}>
                    <TooltipTrigger
                        asChild
                        onMouseMove={handleMouseMove}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Progress
                            max={100}
                            value={progress}
                            className="bg-muted h-3 w-full rounded"
                        />
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                        {progress.toFixed(2)}%
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        key: "state",
        cell: ({ getValue, row }) => {
            let value: string | null = null;
            if (row.original.paused) {
                value = "Paused";
            } else {
                value = snakeToSpace(getValue());
            }
            return <center className="capitalize">{value}</center>;
        },
    },
    {
        key: "seeds",
        cell: ({ getValue }) => {
            return <center>{getValue() || 0}</center>;
        },
    },
    {
        key: "leechs",
        cell: ({ getValue }) => {
            return <center>{getValue() || 0}</center>;
        },
    },
    {
        key: "num_peers",
        keyName: "Peers",
        cell: ({ getValue }) => {
            return <center>{getValue()}</center>;
        },
    },
    {
        key: "eta",
        keyName: "ETA",
        cell: ({ getValue, row }) => {
            const progressValue = row.original.progress;
            const value = getValue() ?? Infinity;
            return (
                <>
                    <center>
                        {formatDurationClean(
                            progressValue < 100 ? value : Infinity,
                        )}
                    </center>
                </>
            );
        },
    },
    {
        key: "download_rate",
        keyName: "Download Speed",
        cell: ({ getValue, row }) => {
            const progress = row.original.progress;
            const downloadState = row.original.state;
            let download_speed = null;
            if (progress === 100 || downloadState === "paused") {
                download_speed = 0;
            } else {
                download_speed = getValue();
            }
            return (
                <div className="flex items-center justify-center gap-2">
                    <span>
                        {download_speed !== null &&
                            formatBytes({
                                bytes: download_speed,
                                perSecond: true,
                            })}
                    </span>
                </div>
            );
        },
    },
    {
        key: "upload_rate",
        keyName: "Upload Speed",

        cell: ({ getValue }) => (
            <div className="flex items-center justify-center gap-2">
                <span>
                    {formatBytes({ bytes: getValue(), perSecond: true })}
                </span>
            </div>
        ),
    },
];

export const torrentTableColumns: ColumnDef<BroadcastTorrentInfo>[] =
    columnsMetadata.map(({ key, cell, keyName }) => ({
        accessorKey: key,
        size: 300,
        header: TableHeaderSortButton(keyName ? keyName : key),
        enableResizing: true,
        ...(cell ? { cell } : {}),
    }));
