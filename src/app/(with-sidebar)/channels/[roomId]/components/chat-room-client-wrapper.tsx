"use client";

import { useEffect, useState } from "react";
import { getUserSession, sidaBarUserInfo } from "@/app/auth.action";
import { getLastReadAt, getMessage } from "../messages.action";
import { getRoom } from "../room.action";
import { ChatRoom } from "./chat-room";
import { clientChatCache } from "@/lib/infrastructure/cache/client-cache";
import { AlertTriangle, Loader2 } from "lucide-react";
import LoadingRoom from "../room-skeleton";

export function ChatRoomClientWrapper({ roomId }: { roomId: string }) {
  // 1. Load from cache immediately on roomId change
  const [messages, setMessages] = useState<any[]>(clientChatCache.getMessages(roomId) || []);
  const cachedRoom = clientChatCache.getRoom(roomId);

  const [data, setData] = useState<{
    userId: string;
    roomData: any;
    initialMessages: any[];
    lastReadAt: any;
    user: any;
  } | null>(cachedRoom ? {
    userId: "", // Placeholder
    roomData: cachedRoom,
    initialMessages: messages,
    lastReadAt: null,
    user: { id: "", username: "...", avatar: null }
  } : null);

  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function init() {
      setIsSyncing(true);
      try {
        const session = await getUserSession();
        const [roomResponse, initialMessagesResponse, lastReadAtResponse, userInfo] =
          await Promise.all([
            getRoom(roomId),
            getMessage(roomId, 50),
            getLastReadAt(session?.user?.id ?? "", roomId),
            sidaBarUserInfo(),
          ]);

        if (roomResponse.status === "success" && roomResponse.data) {
          const fetchedMessages = (initialMessagesResponse.status === "success" ? initialMessagesResponse.data : []) ?? [];
          
          // Save to cache
          clientChatCache.setRoom(roomId, roomResponse.data);
          clientChatCache.setMessages(roomId, fetchedMessages);
          setMessages(fetchedMessages);

          setData({
            userId: session?.user?.id ?? "",
            roomData: roomResponse.data,
            initialMessages: fetchedMessages,
            lastReadAt: lastReadAtResponse.status === "success" ? lastReadAtResponse.data : null,
            user: {
              id: session?.user?.id ?? "",
              username: userInfo.name,
              avatar: userInfo.avatar,
            },
          });
        } else {
          setError("Room tidak ditemukan");
        }
      } catch (e) {
        setError("Terjadi kesalahan sistem");
      } finally {
        setIsSyncing(false);
      }
    }

    init();
  }, [roomId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center space-y-4">
        <AlertTriangle className="text-red-500 w-20 h-20" />
        <h1 className="text-xl font-semibold">{error}</h1>
      </div>
    );
  }

  if (!data) {
    // If we have cached messages, we can actually show a "Partial" ChatRoom
    // but for now let's show the skeleton if we don't even have room metadata
    return <LoadingRoom />;
  }

  return (
    <ChatRoom
      key={roomId} // Force fresh mount on room change
      userId={data.userId}
      roomData={data.roomData}
      initialMessages={messages} // Use the state that could come from cache
      lastReadAt={data.lastReadAt}
      user={data.user}
    />
  );
}
