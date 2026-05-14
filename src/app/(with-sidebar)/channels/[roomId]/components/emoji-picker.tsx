"use client";
import React, { useState } from "react";
import { EmojiPicker } from "frimousse";
import { Smile, Search as SearchIcon } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    triggerClassName?: string;
    triggerSize?: "default" | "sm" | "lg" | "icon";
}

export function EmojiPickerComponent({ onEmojiSelect, triggerClassName, triggerSize }: EmojiPickerProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size={triggerSize ?? "icon"}
                    className={triggerClassName ?? "h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shrink-0 hover:scale-105 active:scale-95"}
                >
                    <Smile className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                sideOffset={12}
                className="w-[320px] p-0 border-border/50 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 overflow-hidden rounded-xl"
            >
                <EmojiPicker.Root
                    onEmojiSelect={({ emoji }) => {
                        onEmojiSelect(emoji);
                        setOpen(false);
                    }}
                    columns={8}
                    className="flex flex-col h-[400px] bg-popover"
                >
                    <div className="relative mx-3 mt-3 mb-2">
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                        <EmojiPicker.Search
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/30 border border-border/40 rounded-lg placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-muted/50"
                            placeholder="Cari emoji..."
                        />
                    </div>

                    <EmojiPicker.Viewport className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                        <EmojiPicker.Loading className="flex flex-col items-center justify-center h-full gap-2 text-sm text-muted-foreground/60">
                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span className="text-xs font-medium animate-pulse">Memuat emoji...</span>
                        </EmojiPicker.Loading>

                        <EmojiPicker.Empty className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/50 p-6 text-center">
                            <SearchIcon className="h-10 w-10 opacity-20" />
                            <p className="text-xs leading-relaxed">
                                Tidak ada emoji yang cocok dengan pencarian Anda.
                            </p>
                        </EmojiPicker.Empty>

                        <EmojiPicker.List
                            className="select-none pb-2"
                            components={{
                                CategoryHeader: ({ category, ...props }) => (
                                    <div
                                        {...props}
                                        style={{ ...props.style, position: 'static', top: 'auto' }}
                                        className="px-2 pt-4 pb-2 text-[12px] font-semibold text-muted-foreground/50"
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
                    </EmojiPicker.Viewport>
                </EmojiPicker.Root>
            </PopoverContent>
        </Popover>
    );
}
