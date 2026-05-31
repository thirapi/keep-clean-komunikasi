import { getUserSession } from "@/app/auth.action";
import { getNotificationsAction } from "./notifications.action";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { Heart, MessageSquare, Repeat, UserPlus, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function NotificationsPage() {
    const session = await getUserSession();
    if (!session?.user?.id) return null;

    const response = await getNotificationsAction();
    const notifications = response.data || [];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/40 px-6 py-4">
                <h1 className="text-xl font-bold tracking-tight">notifikasi</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
                        <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                            <Bell className="h-10 w-10 text-muted-foreground/20" />
                        </div>
                        <h2 className="text-lg font-semibold text-muted-foreground">Belum ada notifikasi</h2>
                        <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mt-1">
                            Aktivitas seperti like, balasan, dan mention akan muncul di sini.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        {notifications.map((notification) => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function NotificationItem({ notification }: { notification: any }) {
    const actor = notification.actor || notification.remoteActor;
    const actorName = actor?.username || actor?.name || "seseorang";
    const avatar = actor?.avatar || "/avatars/avatar1.png";
    
    const iconMap = {
        like: <Heart className="size-4 text-rose-500 fill-rose-500" />,
        reply: <MessageSquare className="size-4 text-primary fill-primary" />,
        repost: <Repeat className="size-4 text-emerald-500" />,
        follow: <UserPlus className="size-4 text-sky-500" />,
        mention: <Bell className="size-4 text-amber-500" />
    };

    const textMap = {
        like: "menyukai postinganmu",
        reply: "membalas postinganmu",
        repost: "membagikan ulang postinganmu",
        follow: "mulai mengikutimu",
        mention: "menyebutmu dalam postingan"
    };

    const targetUrl = notification.targetType === "post" ? `/posts/${notification.targetId}` : `/profile/${actorName}`;

    return (
        <Link 
            href={targetUrl}
            className={cn(
                "flex items-start gap-4 p-4 hover:bg-muted/30 transition-all group",
                !notification.isRead && "bg-primary/5 border-l-2 border-primary"
            )}
        >
            <div className="flex flex-col items-center gap-2 pt-1 shrink-0 w-10">
                <div className="relative">
                    <UserAvatar src={avatar} alt={actorName} className="h-10 w-10 border border-border/50" />
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border shadow-sm">
                        {iconMap[notification.type as keyof typeof iconMap]}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold truncate">{actorName}</span>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: id })}
                    </span>
                </div>
                
                <p className="text-[13px] text-foreground/80 leading-relaxed">
                    {textMap[notification.type as keyof typeof textMap]}
                </p>

                {notification.post?.content && notification.type !== 'follow' && (
                    <div className="mt-2 p-2 rounded-lg bg-muted/20 border border-border/30 italic text-xs text-muted-foreground line-clamp-2">
                        "{notification.post.content}"
                    </div>
                )}
            </div>
        </Link>
    );
}
