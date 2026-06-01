import { getUserSession } from "@/app/auth.action";
import { getNotificationsAction } from "./notifications.action";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { Heart, MessageSquare, Repeat, UserPlus, Bell, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function NotificationsPage() {
    const session = await getUserSession();
    if (!session?.user?.id) return null;

    const response = await getNotificationsAction();
    const notifications = response.data || [];

    return (
        <div className="flex flex-col min-h-screen bg-background/50">
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight">Notifikasi</h1>
                {notifications.length > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        {notifications.length} Aktivitas
                    </span>
                )}
            </div>

            <div className="flex-1">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-6 animate-in fade-in duration-700">
                        <div className="h-20 w-20 rounded-3xl bg-muted/30 flex items-center justify-center mb-6 rotate-3">
                            <Inbox className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Kotak masuk bersih</h2>
                        <p className="text-sm text-muted-foreground max-w-[240px] mx-auto mt-2 leading-relaxed">
                            Aktivitas seperti like, balasan, dan mention akan muncul di sini.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col">
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
        like: <Heart className="size-3.5 text-rose-500 fill-rose-500" />,
        reply: <MessageSquare className="size-3.5 text-primary fill-primary" />,
        repost: <Repeat className="size-3.5 text-emerald-500" />,
        follow: <UserPlus className="size-3.5 text-sky-500" />,
        mention: <Bell className="size-3.5 text-amber-500" />
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
                "flex items-start gap-4 p-4 border-b border-border/30 transition-all post-card-hover group relative",
                !notification.isRead && "bg-primary/[0.03]"
            )}
        >
            {!notification.isRead && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            )}
            
            <div className="flex flex-col items-center gap-2 pt-1 shrink-0 w-11">
                <div className="relative">
                    <UserAvatar src={avatar} alt={actorName} className="h-11 w-11 rounded-xl border border-border/50 shadow-sm" />
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border shadow-sm group-hover:scale-110 transition-transform">
                        {iconMap[notification.type as keyof typeof iconMap]}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">{actorName}</span>
                    <span className="text-[10px] font-bold text-muted-foreground/60 tracking-tight whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: id })}
                    </span>
                </div>
                
                <p className="text-[13px] text-foreground/80 leading-relaxed">
                    {textMap[notification.type as keyof typeof textMap]}
                </p>

                {notification.post?.content && notification.type !== 'follow' && (
                    <div className="mt-2.5 p-3 rounded-xl bg-muted/20 border border-border/20 italic text-xs text-muted-foreground line-clamp-2 group-hover:bg-muted/30 transition-colors">
                        "{notification.post.content}"
                    </div>
                )}
            </div>
        </Link>
    );
}
