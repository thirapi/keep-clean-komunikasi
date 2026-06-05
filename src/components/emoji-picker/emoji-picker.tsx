"use client";
import React, { useState, useMemo } from "react";
import { EmojiPicker } from "frimousse";
import { Smiley, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useEmojis } from "@/components/emoji-provider";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    triggerClassName?: string;
    triggerSize?: "default" | "sm" | "lg" | "icon";
}

export function EmojiPickerComponent({ onEmojiSelect, triggerClassName, triggerSize }: EmojiPickerProps) {
    const [open, setOpen] = useState(false);
    const { customEmojis, isLoading } = useEmojis();
    const [searchQuery, setSearchQuery] = useState("");
    const isMobile = useIsMobile();

    const groupedCustomEmojis = useMemo(() => {
        const filtered = searchQuery 
            ? customEmojis.filter(e => e.shortcode.toLowerCase().includes(searchQuery.toLowerCase()))
            : customEmojis;

        const groups: Record<string, typeof customEmojis> = {};
        filtered.forEach((emoji) => {
            if (!groups[emoji.category]) {
                groups[emoji.category] = [];
            }
            groups[emoji.category].push(emoji);
        });
        return groups;
    }, [customEmojis, searchQuery]);

    const handleEmojiClick = (emoji: string) => {
        onEmojiSelect(emoji);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size={triggerSize ?? "icon"}
                    className={triggerClassName ?? "h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shrink-0 hover:scale-105 active:scale-95 flex items-center justify-center"}
                >
                    <Smiley weight="duotone" className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align={isMobile ? "center" : "start"}
                sideOffset={12}
                className={cn(
                    "p-0 border-border/50 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 overflow-hidden rounded-xl bg-popover",
                    isMobile ? "w-[calc(100vw-32px)] max-w-[360px]" : "w-[320px]"
                )}
            >
                <div className="relative mx-3 mt-3 mb-2">
                    <MagnifyingGlass weight="duotone" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                    <input
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/30 border border-border/40 rounded-lg placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-muted/50"
                        placeholder="Cari emoji..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-col h-[400px]">
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                        {/* Custom Emojis Section */}
                        {isLoading && customEmojis.length === 0 ? (
                             <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground/60">
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <span className="text-[10px] font-medium">Memuat custom emoji...</span>
                             </div>
                        ) : (
                            Object.entries(groupedCustomEmojis).map(([category, emojis]) => (
                                <div key={category} className="px-2 mb-2">
                                    <div className="px-2 pt-4 pb-2 text-[12px] font-semibold text-muted-foreground/50 sticky top-0 bg-popover z-20">
                                        {category}
                                    </div>
                                    <div className="grid grid-cols-8 gap-0">
                                        {emojis.map((emoji) => (
                                            <button
                                                key={emoji.shortcode}
                                                onClick={() => handleEmojiClick(emoji.shortcode)}
                                                title={emoji.shortcode}
                                                className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-primary/10 hover:scale-110 active:scale-90 transition-all cursor-pointer relative group/emoji"
                                            >
                                                <img 
                                                    src={emoji.url} 
                                                    alt={emoji.shortcode} 
                                                    className="w-[22px] h-[22px] object-contain relative z-10" 
                                                />
                                                <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-hover/emoji:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}

                        <EmojiPicker.Root
                            onEmojiSelect={({ emoji }) => {
                                handleEmojiClick(emoji);
                            }}
                            columns={8}
                        >
                            {/* 
                                Removed EmojiPicker.Viewport here because it was causing nested scroll issues.
                                Using the parent's overflow-y-auto instead.
                            */}
                            <EmojiPicker.Loading className="flex flex-col items-center justify-center py-10 gap-2 text-sm text-muted-foreground/60">
                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <span className="text-xs font-medium animate-pulse">Memuat emoji...</span>
                            </EmojiPicker.Loading>

                            <EmojiPicker.Empty className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground/50 p-6 text-center">
                                {Object.keys(groupedCustomEmojis).length === 0 && (
                                    <>
                                        <MagnifyingGlass weight="duotone" className="h-10 w-10 opacity-20" />
                                        <p className="text-xs leading-relaxed">
                                            Tidak ada emoji yang cocok dengan pencarian Anda.
                                        </p>
                                    </>
                                )}
                            </EmojiPicker.Empty>

                            <EmojiPicker.List
                                className="select-none pb-2 px-2"
                                components={{
                                    CategoryHeader: ({ category, ...props }) => (
                                        <div
                                            {...props}
                                            className="px-2 pt-4 pb-2 text-[12px] font-semibold text-muted-foreground/50 bg-popover sticky top-0 z-20"
                                        >
                                            {category.label}
                                        </div>
                                    ),
                                    Emoji: ({ emoji, ...props }) => (
                                        <button
                                            {...props}
                                            title={emoji.label}
                                            className="flex items-center justify-center h-9 w-9 rounded-lg text-[22px] hover:bg-primary/10 hover:scale-110 active:scale-90 transition-all cursor-pointer relative group/emoji"
                                        >
                                            <span className="relative z-10 leading-none">{emoji.emoji}</span>
                                            <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-hover/emoji:opacity-100 transition-opacity" />
                                        </button>
                                    ),
                                }}
                            />
                        </EmojiPicker.Root>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
