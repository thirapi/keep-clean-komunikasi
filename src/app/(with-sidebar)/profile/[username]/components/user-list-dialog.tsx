"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

interface UserListDialogProps {
    title: string;
    trigger: React.ReactNode;
    userId: string;
    fetchAction: (userId: string) => Promise<any>;
}

export function UserListDialog({ title, trigger, userId, fetchAction }: UserListDialogProps) {
    const { data: users = [], isLoading } = useQuery({
        queryKey: ["users", title, userId],
        queryFn: async () => {
            const res = await fetchAction(userId);
            return res.status === "success" ? res.data : [];
        },
        enabled: !!userId,
    });

    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {isLoading ? (
                        <div className="flex justify-center p-4"><CircleNotch weight="duotone" className="animate-spin" /></div>
                    ) : users.length === 0 ? (
                        <p className="text-center text-sm p-4 text-muted-foreground">Tidak ada pengguna.</p>
                    ) : (
                        users.map((user: any) => {
                            const profilePath = user.isRemote 
                                ? `/profile/@${user.username}@${user.domain}`
                                : `/profile/${user.username}`;
                            
                            return (
                                <Link 
                                    key={user.id} 
                                    href={profilePath}
                                    className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-colors"
                                >
                                    <UserAvatar src={user.avatar} className="h-8 w-8" />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{user.username}</span>
                                        {user.isRemote && (
                                            <span className="text-[10px] text-muted-foreground">@{user.username}@{user.domain}</span>
                                        )}
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
