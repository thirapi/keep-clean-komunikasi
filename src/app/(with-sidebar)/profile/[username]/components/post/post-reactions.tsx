"use client";

import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { parseFediverseContent } from "@/lib/fediverse-content-parser";
import { useState, useEffect, useMemo } from "react";
import { getCustomEmojisAction, CustomEmojiDTO } from "@/app/emoji.action";

interface PostReactionsProps {
    reactions: {
        emoji: string;
        count: number;
        users: string[];
        hasReacted: boolean;
    }[];
    onToggleReaction: (emoji: string) => void;
    emojis?: { name: string; url: string }[] | null;
}

export function PostReactions({ reactions, onToggleReaction, emojis }: PostReactionsProps) {
    const [localCustomEmojis, setLocalCustomEmojis] = useState<CustomEmojiDTO[]>([]);

    useEffect(() => {
        getCustomEmojisAction().then((res) => {
            if (res.status === "success" && res.data) {
                setLocalCustomEmojis(res.data);
            }
        });
    }, []);

    const mergedEmojis = useMemo(() => {
        const localMapped = localCustomEmojis.map(e => ({ name: e.shortcode, url: e.url }));
        return [...(emojis || []), ...localMapped];
    }, [emojis, localCustomEmojis]);

    if (reactions.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 mb-1 animate-in fade-in zoom-in-95 duration-200 z-30 relative">
            <TooltipProvider delayDuration={300}>
                {reactions.map((group) => (
                    <Tooltip key={group.emoji}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleReaction(group.emoji);
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all border select-none active:scale-95 hover:scale-105 shadow-sm duration-150 ease-out",
                                    group.hasReacted
                                        ? "bg-primary/15 border-primary/45 text-primary shadow-md shadow-primary/5 ring-1 ring-primary/30"
                                        : "bg-muted/40 border-border/80 hover:bg-muted/70 hover:border-muted-foreground/30 text-muted-foreground"
                                )}
                            >
                                <span 
                                    className="text-base leading-none flex items-center justify-center min-w-[18px] min-h-[18px] transform hover:scale-115 transition-transform duration-100"
                                    dangerouslySetInnerHTML={{ __html: parseFediverseContent(group.emoji, mergedEmojis) }}
                                />
                                <span className={cn(
                                    "font-bold tabular-nums text-[11px]",
                                    group.hasReacted ? "text-primary" : "text-muted-foreground/70"
                                )}>
                                    {group.count}
                                </span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            className="max-w-[250px] rounded-lg border-0 bg-zinc-900 dark:bg-zinc-100 shadow-2xl px-3 py-2"
                        >
                            <div className="flex flex-col gap-2 items-center">
                                <span 
                                    className="text-3xl leading-none flex items-center justify-center p-1"
                                    dangerouslySetInnerHTML={{ __html: parseFediverseContent(group.emoji, mergedEmojis) }}
                                />
                                <p className="text-[11px] font-medium leading-snug text-zinc-100 dark:text-zinc-900 text-center">
                                    <span className="font-bold">{group.users.join(", ")}</span>
                                    {" "}bereaksi
                                </p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    );
}
