"use client";

import { 
    MessageSquare, 
    Repeat2, 
    Heart, 
    Share2, 
    Bookmark, 
    PenLine 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

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
                            />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 shadow-xl">
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
                <ActionButton 
                    icon={Heart} 
                    active={isLiked}
                    activeColor="text-rose-500"
                    fillActive
                    onClick={onLike} 
                    hoverColor="hover:text-rose-500" 
                    hoverBg="hover:bg-rose-500/10"
                    size="large"
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
                />
                <ActionButton 
                    icon={Share2} 
                    onClick={onShare} 
                    hoverColor="hover:text-sky-500" 
                    hoverBg="hover:bg-sky-500/10"
                    size="large"
                />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between mt-3 w-full max-w-md -ml-2">
            <ActionButton 
                icon={MessageSquare} 
                label={replyCount}
                onClick={onReply} 
                hoverColor="hover:text-sky-500" 
                hoverBg="hover:bg-sky-500/10" 
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
                        />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 shadow-lg">
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
            <ActionButton 
                icon={Heart} 
                label={likeCount}
                active={isLiked}
                activeColor="text-rose-500"
                fillActive
                onClick={onLike} 
                hoverColor="hover:text-rose-500" 
                hoverBg="hover:bg-rose-500/10" 
            />
            <ActionButton 
                icon={Bookmark} 
                active={isBookmarked}
                activeColor="text-amber-500"
                fillActive
                onClick={onBookmark} 
                hoverColor="hover:text-amber-500" 
                hoverBg="hover:bg-amber-500/10" 
            />
            <ActionButton 
                icon={Share2} 
                onClick={onShare} 
                hoverColor="hover:text-sky-500" 
                hoverBg="hover:bg-sky-500/10" 
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
    className?: string 
}) {
    const iconSize = size === "large" ? "h-[22px] w-[22px]" : "h-[18px] w-[18px]";
    const padding = size === "large" ? "p-2.5" : "p-2";

    return (
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
}
