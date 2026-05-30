"use client";

import { cn } from "@/lib/utils";

interface PostStatsProps {
    repostCount?: number;
    likeCount?: number;
    replyCount?: number;
    isFocused?: boolean;
    className?: string;
}

export function PostStats({
    repostCount = 0,
    likeCount = 0,
    replyCount = 0,
    isFocused = false,
    className
}: PostStatsProps) {
    if (repostCount === 0 && likeCount === 0 && replyCount === 0 && !isFocused) return null;

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
                <div className="flex gap-1 items-baseline hover:underline cursor-pointer group">
                    <span className="font-bold text-foreground text-[15px] tabular-nums">{repostCount}</span>
                    <span className="text-muted-foreground text-[15px]">Repost</span>
                </div>
            )}
            {likeCount > 0 && (
                <div className="flex gap-1 items-baseline hover:underline cursor-pointer group">
                    <span className="font-bold text-foreground text-[15px] tabular-nums">{likeCount}</span>
                    <span className="text-muted-foreground text-[15px]">Suka</span>
                </div>
            )}
            {isFocused && repostCount === 0 && likeCount === 0 && replyCount === 0 && (
                <div className="text-muted-foreground text-[15px] italic opacity-50">
                    Belum ada interaksi
                </div>
            )}
        </div>
    );
}
