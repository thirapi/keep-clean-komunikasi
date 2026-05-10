"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { requestNotificationPermission } from "@/utils/notifications";
import { usePathname } from "next/navigation";
import { useUnread } from "./unread-provider";

interface Props {
  user: {
    id: string;
    username: string;
  };
}

export function RealtimeNotificationListener({ user }: Props) {
  const pathname = usePathname();
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

        if (Notification.permission === "granted") {
          const notification = new Notification(
            "📩 Pesan Baru dari " + sender,
            {
              body: content,
              icon: "/logo.png",
              tag: `chat-${roomId}`,
              data: { url: roomUrl },
            }
          );

          notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            window.location.href = notification.data.url;
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
