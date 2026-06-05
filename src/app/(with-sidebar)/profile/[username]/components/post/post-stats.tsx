"use client";

import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PostStatsProps {
    repostCount?: number;
    reposters?: string[];
    likeCount?: number;
    likers?: string[];
    reactionCount?: number;
    replyCount?: number;
    isFocused?: boolean;
    className?: string;
}

export function PostStats({
    repostCount = 0,
    reposters = [],
    likeCount = 0,
    likers = [],
    reactionCount = 0,
    replyCount = 0,
    isFocused = false,
    className
}: PostStatsProps) {
    // Show stats if any count is > 0 or if in focused view
    const totalInteractions = repostCount + likeCount + reactionCount + replyCount;
    if (totalInteractions === 0 && !isFocused) return null;

    const likeTooltipText = likers.length > 0 
        ? (likers.length > 10 
            ? `${likers.slice(0, 10).join(", ")} dan ${likers.length - 10} lainnya`
            : likers.join(", "))
        : null;

    const repostTooltipText = reposters.length > 0
        ? (reposters.length > 10
            ? `${reposters.slice(0, 10).join(", ")} dan ${reposters.length - 10} lainnya`
            : reposters.join(", "))
        : null;

    const likeContent = (
        <div className="flex gap-1 items-baseline hover:underline cursor-pointer group">
            <span className="font-bold text-foreground text-[15px] tabular-nums">{likeCount}</span>
            <span className="text-muted-foreground text-[15px]">Suka</span>
        </div>
    );

    const repostContent = (
        <div className="flex gap-1 items-baseline hover:underline cursor-pointer group">
            <span className="font-bold text-foreground text-[15px] tabular-nums">{repostCount}</span>
            <span className="text-muted-foreground text-[15px]">Repost</span>
        </div>
    );

    const reactionContent = (
        <div className="flex gap-1 items-baseline hover:underline cursor-pointer group">
            <span className="font-bold text-foreground text-[15px] tabular-nums">{reactionCount}</span>
            <span className="text-muted-foreground text-[15px]">Tanggapan</span>
        </div>
    );

    return (
        <div className={cn(
            "flex gap-5 py-4",
            isFocused ? "border-y border-border px-1" : "border-t border-border",
            className
        )}>
            {replyCount > 0 && (
                <div className="flex gap-1 items-baseline hover:underline cursor-pointer group">
                    <span className="font-bold text-foreground text-[15px] tabular-nums">{replyCount}</span>
                    <span className="text-muted-foreground text-[15px]">Balasan</span>
                </div>
            )}
            {repostCount > 0 && (
                repostTooltipText ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {repostContent}
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                                <p className="font-semibold mb-1">Direpost oleh:</p>
                                <p>{repostTooltipText}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : repostContent
            )}
            {likeCount > 0 && (
                likeTooltipText ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {likeContent}
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                                <p className="font-semibold mb-1">Disukai oleh:</p>
                                <p>{likeTooltipText}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : likeContent
            )}
            {reactionCount > 0 && reactionContent}
            
            {isFocused && totalInteractions === 0 && (
                <div className="text-muted-foreground text-[15px] italic opacity-50">
                    Belum ada interaksi
                </div>
            )}
        </div>
    );
}
