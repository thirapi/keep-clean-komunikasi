"use client";

import { cn } from "@/lib/utils";
import { Play } from "@phosphor-icons/react/dist/ssr";

interface Attachment {
    id?: string;
    url: string;
    key: string;
    fileType: string;
    size?: number | null;
    description?: string | null;
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

    const getProxiedUrl = (url: string) => {
        if (!url) return "";
        
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        
        // Skip proxy if:
        // 1. URL is relative
        // 2. URL starts with current origin (localhost/production)
        // 3. URL starts with our official production domain (to handle local dev looking at prod assets)
        // 4. URL is already proxied
        if (url.startsWith("/") || 
            url.startsWith(window.location.origin) || 
            url.startsWith(baseUrl) ||
            url.includes("/api/media-proxy")) {
            return url;
        }
        
        return `/api/media-proxy?url=${encodeURIComponent(url)}`;
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
                "grid gap-1 mt-3 rounded-2xl overflow-hidden border border-border bg-muted/20",
                gridClass,
                isQuoted && "mt-2 opacity-90"
            )}
        >
            {attachments.map((att, idx) => {
                const isVideo = att.fileType?.startsWith("video/");
                const proxiedUrl = getProxiedUrl(att.url);
                const isLarge = count === 3 && idx === 0;

                return (
                    <div
                        key={att.id || idx}
                        className={cn(
                            "relative bg-muted flex items-center justify-center overflow-hidden group border-[0.5px] border-border/50",
                            // Grid logic:
                            count === 1 ? "min-h-[200px] max-h-[700px]" : 
                            isLarge ? "row-span-2 aspect-[4/5]" : "aspect-square",
                            "w-full"
                        )}
                    >
                        {/* Background Blur for single image to fill edges without cropping */}
                        {count === 1 && !isVideo && (
                            <div 
                                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30 scale-110 pointer-events-none"
                                style={{ backgroundImage: `url(${proxiedUrl})` }}
                            />
                        )}

                        {isVideo ? (
                            <div
                                className="w-full h-full cursor-pointer pointer-events-auto z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onImageClick) onImageClick(idx);
                                }}
                            >
                                <video
                                    src={proxiedUrl}
                                    className="w-full h-full object-contain bg-black/40 pointer-events-none"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                                    <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-xl">
                                        <Play weight="duotone" className="w-6 h-6 fill-current ml-1" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <img
                                    src={proxiedUrl}
                                    alt={att.description || "Post attachment"}
                                    title={att.description || undefined}
                                    className={cn(
                                        "z-10 cursor-pointer transition-all hover:brightness-95 pointer-events-auto",
                                        // Use contain for single image to avoid crop, cover for grid for aesthetics
                                        count === 1 ? "w-full h-full object-contain max-h-[700px]" : "w-full h-full object-cover"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onImageClick) onImageClick(idx);
                                    }}
                                />
                                {att.description && (
                                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold backdrop-blur-md select-none pointer-events-none z-20">
                                        ALT
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
