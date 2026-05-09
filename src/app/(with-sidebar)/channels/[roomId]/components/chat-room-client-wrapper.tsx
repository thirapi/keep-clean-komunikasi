"use client";

import { useEffect, useState } from "react";
import { getUserSession, sidaBarUserInfo } from "@/app/auth.action";
import { getLastReadAt, getMessage } from "../messages.action";
import { getRoom } from "../room.action";
import { ChatRoom } from "./chat-room";
import { clientChatCache } from "@/lib/infrastructure/cache/client-cache";
import { AlertTriangle } from "lucide-react";
import LoadingRoom from "../room-skeleton";

export function ChatRoomClientWrapper({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>(clientChatCache.getMessages(roomId) || []);
  const cachedRoom = clientChatCache.getRoom(roomId);
  const cachedLastRead = clientChatCache.getLastRead(roomId);

  const [data, setData] = useState<{
    userId: string;
    roomData: any;
    initialMessages: any[];
    lastReadMessageId: string | null;
    lastReadAt: Date | null;
    user: any;
  } | null>(cachedRoom ? {
    userId: "",
    roomData: cachedRoom,
    initialMessages: clientChatCache.getMessages(roomId) || [],
    lastReadMessageId: cachedLastRead.id,
    lastReadAt: cachedLastRead.at,
    user: { id: "", username: "...", avatar: null }
  } : null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const session = await getUserSession();
        const userId = session?.user?.id ?? "";

        const [roomResponse, initialMessagesResponse, lastReadResponse, userInfo] =
          await Promise.all([
            getRoom(roomId),
            getMessage(roomId, 50),
            getLastReadAt(userId, roomId),
            sidaBarUserInfo(),
          ]);

        if (roomResponse.status === "success" && roomResponse.data) {
          const fetchedMessages = (initialMessagesResponse.status === "success" ? initialMessagesResponse.data : []) ?? [];
          const fetchedLastRead = lastReadResponse.status === "success" ? lastReadResponse.data : null;
          
          clientChatCache.setRoom(roomId, roomResponse.data);
          clientChatCache.setMessages(roomId, fetchedMessages);
          clientChatCache.setLastRead(roomId, fetchedLastRead?.id || null);
          
          setMessages(fetchedMessages);

          setData({
            userId,
            roomData: roomResponse.data,
            initialMessages: fetchedMessages,
            lastReadMessageId: fetchedLastRead?.id || null,
            lastReadAt: fetchedLastRead?.at ? new Date(fetchedLastRead.at) : null,
            user: {
              id: userId,
              username: userInfo.name,
              avatar: userInfo.avatar,
            },
          });
        } else {
          setError("Gagal memuat room");
        }
      } catch (e) {
        console.error("Initialization error:", e);
        setError("Terjadi kesalahan sistem");
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
    return <LoadingRoom />;
  }

  return (
    <ChatRoom
      key={roomId}
      userId={data.userId}
      roomData={data.roomData}
      initialMessages={messages}
      lastReadMessageId={data.lastReadMessageId}
      lastReadAt={data.lastReadAt}
      user={data.user}
    />
  );
}
