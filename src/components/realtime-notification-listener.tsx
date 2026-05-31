"use client";

import { useEffect } from "react";
import { pusher } from "@/lib/pusher/pusher.client";
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

    const channel = pusher.subscribe(`user-${user.id}`);

    // CHAT: New Message
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
    channel.bind("message-deleted-notification", () => {
      router.refresh();
    });
// FEED: New Engagement (Like, Repost, Reply, Follow)
channel.bind("new-notification", (data: { id: string, type: string, actorId: string, remoteActorId?: string, postId?: string }) => {
  if (data.type === "reply") {
    playNotificationSound();
    toast("balasan baru masuk", {
      description: "seseorang membalas postinganmu",
      action: {
        label: "lihat",
        onClick: () => router.push(`/posts/${data.postId}`)
      }
    });
  } else if (data.type === "follow") {
    // Subtle toast for follows, no sound
    toast("pengikut baru", {
      description: "seseorang mulai mengikutimu",
    });
  }

  // router.refresh() is kept to update the sidebar unread badge
  router.refresh();
});


    // CHAT: Mark as Read Sync
    channel.bind("room-marked-read", (data: { roomId: string }) => {
      markAsRead(data.roomId);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${user.id}`);
    };
  }, [user.id, pathname, markAsUnread, markAsRead, router]);

  return null;
}
