"use client";

import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { 
    MoreHorizontal, 
    Share2, 
    Flag, 
    Trash2,
    Globe,
    Lock,
    Users
} from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserHoverCard } from "./user-hover-card";
import { parseFediverseContent } from "@/lib/fediverse-content-parser";

interface PostHeaderProps {
    user: {
        username: string;
        identifier: string;
        displayName?: string;
        avatar?: string;
        handle: string;
        profilePath: string;
        isRemote?: boolean;
        domain?: string;
        emojis?: { name: string; url: string }[] | null;
    };
    createdAt: Date;
    visibility: "public" | "unlisted" | "private";
    isFocused?: boolean;
    onDelete?: () => void;
    onCopyLink?: () => void;
    onReport?: () => void;
    isCurrentUser?: boolean;
    currentUserId?: string;
}

export function PostHeader({
    user,
    createdAt,
    visibility,
    isFocused = false,
    onDelete,
    onCopyLink,
    onReport,
    isCurrentUser = false,
    currentUserId
}: PostHeaderProps) {
    const VisibilityIcon = ({ visibility, className }: { visibility?: string, className?: string }) => {
        if (visibility === "unlisted") return <Users className={cn("h-3 w-3", className)} />;
        if (visibility === "private") return <Lock className={cn("h-3 w-3", className)} />;
        return <Globe className={cn("h-3 w-3", className)} />;
    };

    const displayNameWithEmojis = parseFediverseContent(user.displayName || user.username, user.emojis);

    if (isFocused) {
        return (
            <div className="flex items-start justify-between mb-4 relative w-full">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Link href={user.profilePath} className="hover:opacity-80 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <UserAvatar src={user.avatar || "/avatars/avatar1.png"} className="h-12 w-12" />
                    </Link>
                    <div className="flex flex-col min-w-0 pr-10">
                        <div className="flex flex-col leading-tight">
                            <UserHoverCard user={user} currentUserId={currentUserId}>
                                <Link 
                                    href={user.profilePath} 
                                    className="font-bold text-[17px] text-foreground hover:underline line-clamp-1" 
                                    onClick={(e) => e.stopPropagation()}
                                    dangerouslySetInnerHTML={{ __html: displayNameWithEmojis }}
                                />
                            </UserHoverCard>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[14px]">
                                <span className="line-clamp-1">{user.handle}</span>
                                <span className="shrink-0">·</span>
                                <VisibilityIcon visibility={visibility} className="h-3.5 w-3.5 opacity-60" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="shrink-0 absolute top-[-6px] right-[-8px]">
                    <PostMenu 
                        onCopyLink={onCopyLink} 
                        onReport={onReport} 
                        onDelete={onDelete} 
                        isCurrentUser={isCurrentUser} 
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start justify-between mb-0.5 relative w-full">
            <div className="flex flex-col min-w-0 flex-1 pr-8">
                <div className="flex items-center gap-1.5 min-w-0 leading-tight mb-0.5">
                    <UserHoverCard user={user} currentUserId={currentUserId}>
                        <Link 
                            href={user.profilePath} 
                            className="font-bold text-[15px] text-foreground hover:underline line-clamp-1 shrink-0 max-w-full" 
                            onClick={(e) => e.stopPropagation()}
                            dangerouslySetInnerHTML={{ __html: displayNameWithEmojis }}
                        />
                    </UserHoverCard>
                    <span className="text-muted-foreground text-[13px] shrink-0">·</span>
                    <span className="text-muted-foreground text-[13px] whitespace-nowrap shrink-0 hover:underline" title={createdAt.toLocaleString()}>
                        {formatDistanceToNow(createdAt, { addSuffix: true, locale: id })}
                    </span>
                    <span className="text-muted-foreground text-[13px] shrink-0">·</span>
                    <VisibilityIcon visibility={visibility} className="h-3 w-3 opacity-60" />
                    {user.isRemote && (
                        <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 
                                    bg-gradient-to-r from-violet-100 to-indigo-100 
                                    dark:from-violet-950 dark:to-indigo-950 
                                    border border-violet-200 dark:border-violet-800 
                                    rounded-xl text-[10px] font-medium 
                                    text-violet-700 dark:text-violet-300
                                    shadow-sm"
                        title="Post dari instance lain (Fediverse)"
                        >
                        <span className="text-base leading-none opacity-75">⁂</span>
                        Remote
                        </span>
                    )}
                </div>
                <Link href={user.profilePath} className="text-muted-foreground text-[13px] line-clamp-1 leading-none mb-1.5" onClick={(e) => e.stopPropagation()}>
                    {user.handle}
                </Link>
            </div>
            <div className="shrink-0 absolute top-[-6px] right-[-10px]">
                <PostMenu 
                    onCopyLink={onCopyLink} 
                    onReport={onReport} 
                    onDelete={onDelete} 
                    isCurrentUser={isCurrentUser} 
                    size="small"
                />
            </div>
        </div>
    );
}

function PostMenu({ 
    onCopyLink, 
    onReport, 
    onDelete, 
    isCurrentUser,
    size = "normal"
}: { 
    onCopyLink?: () => void, 
    onReport?: () => void, 
    onDelete?: () => void, 
    isCurrentUser: boolean,
    size?: "normal" | "small"
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "text-muted-foreground rounded-full hover:bg-sky-500/10 hover:text-sky-500 transition-colors",
                        size === "small" ? "h-8 w-8" : "h-9 w-9"
                    )}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                    <MoreHorizontal className={size === "small" ? "h-4 w-4" : "h-5 w-5"} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                onClick={(e) => e.stopPropagation()} 
                align="end" 
                className="w-48 shadow-xl"
            >
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopyLink?.(); }} className="gap-2 py-2.5">
                    <Share2 className="h-4 w-4" />
                    <span>Salin Tautan</span>
                </DropdownMenuItem>
                {!isCurrentUser && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReport?.(); }} className="gap-2 py-2.5 text-amber-500 focus:text-amber-500">
                        <Flag className="h-4 w-4" />
                        <span>Laporkan</span>
                    </DropdownMenuItem>
                )}
                {isCurrentUser && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="gap-2 py-2.5 text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            <span>Hapus</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
