"use client";

import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

interface Attachment {
    id?: string;
    url: string;
    key: string;
    fileType: string;
    size?: number | null;
}

interface PostMediaProps {
    attachments: Attachment[];
    onImageClick?: (index: number) => void;
    isQuoted?: boolean;
}

export function PostMedia({ attachments, onImageClick, isQuoted = false }: PostMediaProps) {
    if (!attachments || attachments.length === 0) return null;

    const count = attachments.length;
    const gridClass = count === 1 ? "grid-cols-1" : "grid-cols-2";

    return (
        <div
            className={cn(
                "grid gap-1 mt-3 rounded-2xl overflow-hidden border border-white/5 bg-black/20",
                gridClass,
                isQuoted && "mt-2 opacity-90"
            )}
        >
            {attachments.map((att, idx) => {
                const isVideo = att.fileType?.startsWith("video/");
                // Special layout for 3 items: first item is tall
                const isLarge = count === 3 && idx === 0;

                return (
                    <div
                        key={att.id || idx}
                        className={cn(
                            "relative bg-zinc-900 flex items-center justify-center overflow-hidden group border-[0.5px] border-white/5",
                            isLarge ? "row-span-2 aspect-[4/5]" : "aspect-video",
                            count === 1 ? "aspect-auto max-h-[500px]" : ""
                        )}
                    >
                        {isVideo ? (
                            <div
                                className="w-full h-full cursor-pointer pointer-events-auto"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onImageClick) onImageClick(idx);
                                }}
                            >
                                <video
                                    src={att.url}
                                    className="w-full h-full object-contain bg-black pointer-events-none"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                    <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white">
                                        <Play className="w-5 h-5 fill-current" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <img
                                src={att.url}
                                alt="Post attachment"
                                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity pointer-events-auto"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onImageClick) onImageClick(idx);
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
