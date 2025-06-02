"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { requestNotificationPermission } from "@/utils/notifications";
import { usePathname } from "next/navigation";

interface Props {
  user: {
    id: string;
    username: string;
  };
}

export function RealtimeNotificationListener({ user }: Props) {
  const pathname = usePathname();

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
      const roomUrl = `/channels/${message.roomId}`;

      const isViewingRoom = pathname === roomUrl;

      // toast(`📨 Pesan baru dari ${sender}: ${content}`);

      if (!isViewingRoom) {
        if (Notification.permission === "granted") {
          const notification = new Notification(
            "📩 Pesan Baru dari " + sender,
            {
              body: content,
              icon: "/logo.png",
              tag: `chat-${message.roomId}`,
              data: { url: `/channels/${message.roomId}` },
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

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${user.id}`);
    };
  }, [user.id]);

  return null;
}
