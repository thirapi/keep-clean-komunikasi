"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
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

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`user-${user.id}`);

    channel.bind("new-message-notification", (data: any) => {
      const { message } = data;
      const sender = message.user.username || "unknown";
      const avatar = message.user.avatar || "/avatars/avatar1.png";
      const content = message.content || "[Pesan Gambar]";
      const roomId = message.roomId;
      const roomUrl = `/channels/${roomId}`;

      const isViewingRoom = pathname === roomUrl;

      if (message.userId === user.id) {
        return;
      }

      if (!isViewingRoom) {
        // Mark as unread in sidebar context
        markAsUnread(roomId);

        // 1. In-App Rich Toast (Sonner)
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

        // 2. System Notification (Background)
        if (Notification.permission === "granted" && document.visibilityState === "hidden") {
          const notification = new Notification(
            sender,
            {
              body: content,
              icon: avatar,
              tag: `chat-${roomId}`,
              data: { url: roomUrl },
            }
          );

          notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            router.push(roomUrl);
          };
        }
      }
    });

    // Listen for read sync across devices
    channel.bind("room-marked-read", (data: { roomId: string }) => {
      markAsRead(data.roomId);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${user.id}`);
    };
  }, [user.id, pathname, markAsUnread, markAsRead]);

  return null;
}
