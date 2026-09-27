"use client";

import { useEffect, useRef } from "react";
import { getPusher } from "@/lib/pusher/pusher.client";
import { toast } from "sonner";
import { requestNotificationPermission } from "@/utils/notifications";
import { usePathname, useRouter } from "next/navigation";
import { useUnread } from "./unread-provider";
import { UserAvatar } from "./ui/user-avatar";

interface Props {
  user: {
    id: string;
    username: string;
  };
}

export function RealtimeNotificationListener({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { markAsUnread, markAsRead } = useUnread();

  // Read through a ref so the Pusher subscription is bound once for the whole
  // session. `pathname` in the dependency array used to tear down and rebuild
  // the channel (unbind_all + unsubscribe + subscribe + 3 binds) on every route
  // change, and the handler was reading a stale pathname in between.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/sounds/message-notification.mp3");
      audio.play().catch((e) => {
        // This is usually due to browser autoplay policy
        console.warn("[Notification] Audio play failed (user interaction required):", e);
      });
    } catch (e) {
      console.warn("[Notification] Audio context failed:", e);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!user.id) return;

    const channel = getPusher().subscribe(`user-${user.id}`);

    // CHAT: New Message
    channel.bind("new-message-notification", (data: any) => {
      const { message } = data;
      const sender = message.user.username || "unknown";
      const avatar = message.user.avatar || "/avatars/avatar1.png";
      const content = message.content || "[Pesan Gambar]";
      const roomId = message.roomId;
      const roomUrl = `/channels/${roomId}`;

      const isViewingRoom = pathnameRef.current === roomUrl;

      if (message.userId === user.id) {
        return;
      }

      playNotificationSound();

      if (!isViewingRoom) {
        markAsUnread(roomId);

        toast.custom((t) => (
          <div 
            className="flex items-center gap-3 bg-background/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-2xl cursor-pointer hover:bg-muted/50 transition-all group"
            onClick={() => {
              toast.dismiss(t);
              router.push(roomUrl);
            }}
          >
            <div className="relative">
              <UserAvatar src={avatar} alt={sender} className="h-10 w-10 ring-2 ring-primary/10" />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-primary border-2 border-background rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{sender}</p>
              <p className="text-xs text-muted-foreground truncate line-clamp-1">{content}</p>
            </div>
          </div>
        ), {
          duration: 4000,
          position: "top-right",
        });

        if (Notification.permission === "granted" && document.visibilityState === "hidden") {
          new Notification(sender, {
            body: content,
            icon: avatar,
            tag: `chat-${roomId}`,
          }).onclick = () => {
            window.focus();
            router.push(roomUrl);
          };
        }
      }
    });

    // CHAT: Message Deleted
    channel.bind("message-deleted-notification", (data: { roomId?: string }) => {
      // A refresh re-renders the whole server tree. A deletion in a room the
      // user is not viewing cannot change what is on screen, so only refresh
      // for the room currently open; otherwise rely on the unread badge.
      if (data?.roomId && pathnameRef.current === `/channels/${data.roomId}`) {
        router.refresh();
      }
    });
    // CHAT: Mark as Read Sync
    channel.bind("room-marked-read", (data: { roomId: string }) => {
      markAsRead(data.roomId);
    });

    return () => {
      channel.unbind_all();
      getPusher().unsubscribe(`user-${user.id}`);
    };
  }, [user.id, markAsUnread, markAsRead, router]);

  return null;
}
