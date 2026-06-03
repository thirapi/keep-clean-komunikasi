"use client";

import { 
    MessageSquare, 
    Repeat2, 
    Heart, 
    Share2, 
    Bookmark, 
    PenLine,
    Smile
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmojiPickerComponent } from "@/components/emoji-picker/emoji-picker";

interface PostActionsProps {
    replyCount?: number;
    repostCount?: number;
    likeCount?: number;
    isLiked?: boolean;
    isReposted?: boolean;
    isBookmarked?: boolean;
    onReply: () => void;
    onRepost: () => void;
    onQuote: () => void;
    onLike: () => void;
    onBookmark: () => void;
    onShare: () => void;
    onReactionSelect: (emoji: string) => void;
    isFocused?: boolean;
}

export function PostActions({
    replyCount,
    repostCount,
    likeCount,
    isLiked,
    isReposted,
    isBookmarked,
    onReply,
    onRepost,
    onQuote,
    onLike,
    onBookmark,
    onShare,
    onReactionSelect,
    isFocused = false
}: PostActionsProps) {
    if (isFocused) {
        return (
            <div className="flex items-center justify-around py-1 mb-1">
                <ActionButton 
                    icon={MessageSquare} 
                    onClick={onReply} 
                    hoverColor="hover:text-sky-500" 
                    hoverBg="hover:bg-sky-500/10"
                    size="large"
                    tooltip="Balas"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div onClick={(e) => e.stopPropagation()}>
                            <ActionButton 
                                icon={Repeat2} 
                                active={isReposted}
                                activeColor="text-emerald-500"
                                hoverColor="hover:text-emerald-500" 
                                hoverBg="hover:bg-emerald-500/10"
                                size="large"
                                tooltip="Bagikan Ulang"
                            />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        onClick={(e) => e.stopPropagation()} 
                        align="start" 
                        className="w-48 shadow-xl"
                    >
                        <DropdownMenuItem 
                            onClick={(e) => {
                                e.stopPropagation();
                                onRepost();
                            }} 
                            className="gap-2 py-3 cursor-pointer"
                        >
                            <Repeat2 className="h-5 w-5" />
                            <span className="font-medium">{isReposted ? "Batal Repost" : "Repost"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={(e) => {
                                e.stopPropagation();
                                onQuote();
                            }} 
                            className="gap-2 py-3 cursor-pointer"
                        >
                            <PenLine className="h-5 w-5" />
                            <span className="font-medium">Kutip</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <div onClick={(e) => e.stopPropagation()}>
                    <EmojiPickerComponent 
                        onEmojiSelect={onReactionSelect} 
                        triggerClassName="h-10 w-10 rounded-full text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all shrink-0 hover:scale-110 active:scale-95 flex items-center justify-center"
                    />
                </div>
                <ActionButton 
                    icon={Heart} 
                    active={isLiked}
                    activeColor="text-rose-500"
                    fillActive
                    onClick={onLike} 
                    hoverColor="hover:text-rose-500" 
                    hoverBg="hover:bg-rose-500/10"
                    size="large"
                    tooltip={isLiked ? "Batal Suka" : "Suka"}
                />
                <ActionButton 
                    icon={Bookmark} 
                    active={isBookmarked}
                    activeColor="text-amber-500"
                    fillActive
                    onClick={onBookmark} 
                    hoverColor="hover:text-amber-500" 
                    hoverBg="hover:bg-amber-500/10"
                    size="large"
                    tooltip={isBookmarked ? "Hapus dari Bookmark" : "Simpan ke Bookmark"}
                />
                <ActionButton 
                    icon={Share2} 
                    onClick={onShare} 
                    hoverColor="hover:text-sky-500" 
                    hoverBg="hover:bg-sky-500/10"
                    size="large"
                    tooltip="Bagikan"
                />
            </div>
        );
    }

    return (
        <div 
            onClick={(e) => e.stopPropagation()} 
            className="flex items-center justify-between mt-3 w-full max-w-md -ml-2"
        >
            <ActionButton 
                icon={MessageSquare} 
                label={replyCount}
                onClick={onReply} 
                hoverColor="hover:text-sky-500" 
                hoverBg="hover:bg-sky-500/10" 
                tooltip="Balas"
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div onClick={(e) => e.stopPropagation()}>
                        <ActionButton 
                            icon={Repeat2} 
                            label={repostCount}
                            active={isReposted}
                            activeColor="text-emerald-500"
                            hoverColor="hover:text-emerald-500" 
                            hoverBg="hover:bg-emerald-500/10" 
                            tooltip="Bagikan Ulang"
                        />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                    onClick={(e) => e.stopPropagation()} 
                    align="start" 
                    className="w-48 shadow-lg"
                >
                    <DropdownMenuItem 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRepost();
                        }} 
                        className="gap-2 py-2.5 cursor-pointer"
                    >
                        <Repeat2 className="h-4 w-4" />
                        <span>{isReposted ? "Batal Repost" : "Repost"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={(e) => {
                            e.stopPropagation();
                            onQuote();
                        }} 
                        className="gap-2 py-2.5 cursor-pointer"
                    >
                        <PenLine className="h-4 w-4" />
                        <span>Kutip</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <div onClick={(e) => e.stopPropagation()}>
                <EmojiPickerComponent 
                    onEmojiSelect={onReactionSelect} 
                    triggerClassName="h-9 w-9 rounded-full text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all shrink-0 hover:scale-110 active:scale-95 flex items-center justify-center"
                />
            </div>
            <ActionButton 
                icon={Heart} 
                label={likeCount}
                active={isLiked}
                activeColor="text-rose-500"
                fillActive
                onClick={onLike} 
                hoverColor="hover:text-rose-500" 
                hoverBg="hover:bg-rose-500/10" 
                tooltip={isLiked ? "Batal Suka" : "Suka"}
            />
            <ActionButton 
                icon={Bookmark} 
                active={isBookmarked}
                activeColor="text-amber-500"
                fillActive
                onClick={onBookmark} 
                hoverColor="hover:text-amber-500" 
                hoverBg="hover:bg-amber-500/10" 
                tooltip={isBookmarked ? "Hapus dari Bookmark" : "Simpan ke Bookmark"}
            />
            <ActionButton 
                icon={Share2} 
                onClick={onShare} 
                hoverColor="hover:text-sky-500" 
                hoverBg="hover:bg-sky-500/10" 
                tooltip="Bagikan"
            />
        </div>
    );
}

function ActionButton({ 
    icon: Icon, 
    label, 
    onClick, 
    hoverColor, 
    hoverBg, 
    active, 
    activeColor, 
    fillActive,
    size = "normal",
    tooltip,
    className 
}: { 
    icon: any, 
    label?: string | number, 
    onClick?: (e: React.MouseEvent) => void, 
    hoverColor: string, 
    hoverBg: string, 
    active?: boolean, 
    activeColor?: string, 
    fillActive?: boolean,
    size?: "normal" | "large",
    tooltip?: string,
    className?: string 
}) {
    const iconSize = size === "large" ? "h-[22px] w-[22px]" : "h-[18px] w-[18px]";
    const padding = size === "large" ? "p-2.5" : "p-2";

    const button = (
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
            }} 
            className={cn(
                "group flex items-center gap-1 transition-colors outline-none",
                active ? activeColor : "text-muted-foreground",
                !active && hoverColor,
                className
            )}
        >
            <div className={cn(
                "rounded-full transition-all flex items-center justify-center",
                padding,
                hoverBg
            )}>
                <Icon className={cn(
                    iconSize,
                    "transition-transform group-active:scale-75 duration-200",
                    active && fillActive && "fill-current"
                )} />
            </div>
            {label !== undefined && label !== "" && label !== 0 && (
                <span className={cn(
                    "font-medium tabular-nums",
                    size === "large" ? "text-[15px]" : "text-[13px]"
                )}>
                    {label}
                </span>
            )}
        </button>
    );

    if (tooltip) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {button}
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px] px-2 py-1">
                        <p>{tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return button;
}
