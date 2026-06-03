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
    Users,
    ExternalLink,
    VolumeX,
    Gauge,
    Info
} from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { UserHoverCard } from "./user-hover-card";
import { parseFediverseContent } from "@/lib/fediverse-content-parser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toggleAccountFilterAction, getUserFiltersAction } from "@/app/(with-sidebar)/user.action";
import { toast } from "sonner";
import { useState } from "react";

interface PostHeaderProps {
    user: {
        id: string;
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
    originalUrl?: string | null;
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
    currentUserId,
    originalUrl
}: PostHeaderProps) {
    const queryClient = useQueryClient();
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, type: "mute" | "reduce_intensity" | null }>({
        open: false,
        type: null
    });

    // Fetch user filters to show active state in menu
    const { data: filtersResponse } = useQuery({
        queryKey: ["user-filters", currentUserId],
        queryFn: () => currentUserId ? getUserFiltersAction(currentUserId!) : null,
        enabled: !!currentUserId,
    });

    const filters = filtersResponse?.status === "success" ? filtersResponse.data : [];
    
    const activeFilter = filters?.find(f => 
        user.isRemote 
            ? f.targetRemoteActorId === user.id 
            : f.targetUserId === user.id
    );

    const filterMutation = useMutation({
        mutationFn: (type: "mute" | "reduce_intensity") => {
            if (!currentUserId) throw new Error("Unauthorized");
            return toggleAccountFilterAction({
                userId: currentUserId,
                targetId: user.id,
                isRemote: !!user.isRemote,
                type
            });
        },
        onSuccess: (res) => {
            if (res.status === "success") {
                const { action, type } = res.data!;
                const label = type === "mute" ? "Bisukan" : "Batasi Intensitas";
                toast.success(action === "applied" ? `${label} diaktifkan` : `${label} dimatikan`);
                queryClient.invalidateQueries({ queryKey: ["user-filters", currentUserId] });
                queryClient.invalidateQueries({ queryKey: ["posts"] });
            } else {
                toast.error(res.error?.message || "Gagal mengubah filter");
            }
        }
    });

    const handleFilterClick = (type: "mute" | "reduce_intensity") => {
        // Only show confirmation if we are applying (not removing)
        if (activeFilter?.type === type) {
            filterMutation.mutate(type);
        } else {
            setConfirmDialog({ open: true, type });
        }
    };

    const VisibilityIcon = ({ visibility, className }: { visibility?: string, className?: string }) => {
        let icon = <Globe className={cn("h-3 w-3", className)} />;
        let label = "Publik";
        
        if (visibility === "unlisted") {
            icon = <Users className={cn("h-3 w-3", className)} />;
            label = "Tidak Terdaftar";
        } else if (visibility === "private") {
            icon = <Lock className={cn("h-3 w-3", className)} />;
            label = "Hanya Pengikut";
        }

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center cursor-default">
                            {icon}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px] px-2 py-1">
                        <p>{label}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
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
                                <span>{user.handle}</span>
                                <span className="shrink-0">·</span>
                                <VisibilityIcon visibility={visibility} className="h-3.5 w-3.5 opacity-60" />
                                {user.isRemote && (
                                    <>
                                        <span className="shrink-0">·</span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span 
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 
                                                                    bg-gradient-to-r from-violet-100 to-indigo-100 
                                                                    dark:from-violet-950 dark:to-indigo-950 
                                                                    border border-violet-200 dark:border-violet-800 
                                                                    rounded-xl text-[10px] font-medium 
                                                                    text-violet-700 dark:text-violet-300
                                                                    shadow-sm cursor-default"
                                                    >
                                                        <span className="text-base leading-none opacity-75">⁂</span>
                                                        Remote
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="text-[11px] px-2 py-1">
                                                    <p>Post dari instance lain (Fediverse)</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </>
                                )}
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
                        originalUrl={originalUrl}
                        isRemote={user.isRemote}
                        onFilter={handleFilterClick}
                        activeFilterType={activeFilter?.type}
                    />
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    <AlertDialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog(prev => ({ ...prev, open: o }))}>
                        <AlertDialogContent className="max-w-md">
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {confirmDialog.type === "mute" ? "Bisukan Akun?" : "Batasi Intensitas?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="space-y-3 pt-2">
                                        {confirmDialog.type === "mute" ? (
                                            <p>Postingan dari akun ini akan <span className="font-bold text-foreground">disembunyikan sepenuhnya</span> dari timeline Anda. Anda tetap bisa melihat postingannya dengan mengunjungi profilnya secara langsung.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                <p>Sistem akan membatasi akun ini agar tidak mendominasi timeline Anda:</p>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    <li>Maksimal 2 postingan beruntun untuk aktivitas baru.</li>
                                                    <li>Postingan ke-3 dan seterusnya akan disembunyikan.</li>
                                                    <li><span className="font-bold text-foreground">Pengecualian</span>: Balasan beruntun (Thread) tidak akan dipotong agar konteks tetap terjaga.</li>
                                                </ul>
                                            </div>
                                        )}
                                        <p className="text-[11px] text-muted-foreground italic flex items-center gap-1 pt-2">
                                            <Info className="h-3 w-3" />
                                            Tindakan ini hanya berpengaruh pada akun Anda sendiri.
                                        </p>
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={() => {
                                        if (confirmDialog.type) filterMutation.mutate(confirmDialog.type);
                                    }}
                                    className={cn("rounded-xl", confirmDialog.type === "mute" ? "bg-destructive hover:bg-destructive/90" : "bg-primary")}
                                >
                                    Lanjutkan
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="text-muted-foreground text-[13px] whitespace-nowrap shrink-0 hover:underline cursor-default">
                                    {formatDistanceToNow(createdAt, { addSuffix: true, locale: id })}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-[11px] px-2 py-1">
                                <p>{createdAt.toLocaleString()}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <span className="text-muted-foreground text-[13px] shrink-0">·</span>
                    <VisibilityIcon visibility={visibility} className="h-3 w-3 opacity-60" />
                    {user.isRemote && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span 
                                        className="inline-flex items-center gap-1 px-2 py-0.5 
                                                    bg-gradient-to-r from-violet-100 to-indigo-100 
                                                    dark:from-violet-950 dark:to-indigo-950 
                                                    border border-violet-200 dark:border-violet-800 
                                                    rounded-xl text-[10px] font-medium 
                                                    text-violet-700 dark:text-violet-300
                                                    shadow-sm cursor-default"
                                    >
                                        <span className="text-base leading-none opacity-75">⁂</span>
                                        Remote
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-[11px] px-2 py-1">
                                    <p>Post dari instance lain (Fediverse)</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
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
                    originalUrl={originalUrl}
                    isRemote={user.isRemote}
                    onFilter={handleFilterClick}
                    activeFilterType={activeFilter?.type}
                    size="small"
                />
            </div>

            <div onClick={(e) => e.stopPropagation()}>
                <AlertDialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog(prev => ({ ...prev, open: o }))}>
                    <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {confirmDialog.type === "mute" ? "Bisukan Akun?" : "Batasi Intensitas?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="space-y-3 pt-2">
                                    {confirmDialog.type === "mute" ? (
                                        <p>Postingan dari akun ini akan <span className="font-bold text-foreground">disembunyikan sepenuhnya</span> dari timeline Anda. Anda tetap bisa melihat postingannya dengan mengunjungi profilnya secara langsung.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            <p>Sistem akan membatasi akun ini agar tidak mendominasi timeline Anda:</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                <li>Maksimal 2 postingan beruntun untuk aktivitas baru.</li>
                                                <li>Postingan ke-3 dan seterusnya akan disembunyikan.</li>
                                                <li><span className="font-bold text-foreground">Pengecualian</span>: Balasan beruntun (Thread) tidak akan dipotong agar konteks tetap terjaga.</li>
                                            </ul>
                                        </div>
                                    )}
                                    <p className="text-[11px] text-muted-foreground italic flex items-center gap-1 pt-2">
                                        <Info className="h-3 w-3" />
                                        Tindakan ini hanya berpengaruh pada akun Anda sendiri.
                                    </p>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => {
                                    if (confirmDialog.type) filterMutation.mutate(confirmDialog.type);
                                }}
                                className={cn("rounded-xl", confirmDialog.type === "mute" ? "bg-destructive hover:bg-destructive/90" : "bg-primary")}
                            >
                                Lanjutkan
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

function PostMenu({ 
    onCopyLink, 
    onReport, 
    onDelete, 
    isCurrentUser,
    originalUrl,
    isRemote,
    onFilter,
    activeFilterType,
    size = "normal"
}: { 
    onCopyLink?: () => void, 
    onReport?: () => void, 
    onDelete?: () => void, 
    isCurrentUser: boolean,
    originalUrl?: string | null,
    isRemote?: boolean,
    onFilter?: (type: "mute" | "reduce_intensity") => void,
    activeFilterType?: "mute" | "reduce_intensity",
    size?: "normal" | "small"
}) {
    return (
        <DropdownMenu>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px] px-2 py-1">
                        <p>Lainnya</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent 
                onClick={(e) => e.stopPropagation()} 
                align="end" 
                className="w-56 shadow-xl"
            >
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopyLink?.(); }} className="gap-2 py-2.5">
                    <Share2 className="h-4 w-4" />
                    <span>Salin Tautan</span>
                </DropdownMenuItem>
                {originalUrl && isRemote && (
                    <DropdownMenuItem asChild>
                        <a 
                            href={originalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2 py-2.5 px-2 text-sm cursor-pointer hover:bg-accent transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="h-4 w-4" />
                            <span>Buka di Instance Asli</span>
                        </a>
                    </DropdownMenuItem>
                )}

                {!isCurrentUser && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); onFilter?.("reduce_intensity"); }} 
                            className={cn(
                                "gap-2 py-2.5",
                                activeFilterType === "reduce_intensity" && "text-primary focus:text-primary font-medium"
                            )}
                        >
                            <Gauge className="h-4 w-4" />
                            <span>{activeFilterType === "reduce_intensity" ? "Jangan Batasi Intensitas" : "Batasi Intensitas"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); onFilter?.("mute"); }} 
                            className={cn(
                                "gap-2 py-2.5",
                                activeFilterType === "mute" && "text-destructive focus:text-destructive font-medium"
                            )}
                        >
                            <VolumeX className="h-4 w-4" />
                            <span>{activeFilterType === "mute" ? "Batal Bisukan Akun" : "Bisukan Akun"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReport?.(); }} className="gap-2 py-2.5 text-amber-500 focus:text-amber-500">
                            <Flag className="h-4 w-4" />
                            <span>Laporkan</span>
                        </DropdownMenuItem>
                    </>
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
