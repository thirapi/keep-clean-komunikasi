"use client";

import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PostReactionsProps {
    reactions: {
        emoji: string;
        count: number;
        users: string[];
        hasReacted: boolean;
    }[];
    onToggleReaction: (emoji: string) => void;
}

export function PostReactions({ reactions, onToggleReaction }: PostReactionsProps) {
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
                                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs transition-all border select-none active:scale-90 shadow-sm",
                                    group.hasReacted
                                        ? "bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/20"
                                        : "bg-muted/30 border-transparent hover:bg-muted/60 text-muted-foreground"
                                )}
                            >
                                <span className="text-sm leading-none">{group.emoji}</span>
                                <span className={cn(
                                    "font-bold tabular-nums",
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
                            <div className="flex flex-col gap-1">
                                <span className="text-base leading-none">{group.emoji}</span>
                                <p className="text-[11px] font-medium leading-snug text-zinc-100 dark:text-zinc-900">
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
