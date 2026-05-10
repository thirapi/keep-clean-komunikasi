import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface YouTubeEmbedProps {
    videoId: string;
    className?: string;
}

export function YouTubeEmbed({ videoId, className }: YouTubeEmbedProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return (
        <div className={cn("mt-2 max-w-[450px]", className)}>
            {/* Toggle header */}
            <button
                onClick={() => setIsVisible((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
                {isVisible ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                YouTube
            </button>

            {isVisible && (
                <div className="relative w-full rounded-xl overflow-hidden border border-border/50 shadow-sm">
                    {!isLoaded ? (
                        <div
                            className="relative aspect-video cursor-pointer group/thumb bg-black"
                            onClick={() => setIsLoaded(true)}
                        >
                            <img
                                src={thumbnailUrl}
                                alt="YouTube video thumbnail"
                                className="w-full h-full object-cover opacity-90 group-hover/thumb:opacity-70 transition-opacity duration-200"
                            />
                            {/* Lucide Play button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black/50 group-hover/thumb:bg-black/70 transition-colors rounded-full p-4">
                                    <Play className="w-8 h-8 text-white fill-white" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative aspect-video">
                            <iframe
                                src={embedUrl}
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
