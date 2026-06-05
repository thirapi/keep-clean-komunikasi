"use client";

import { useEffect, useState } from "react";
import { getUserSession, sidaBarUserInfo } from "@/app/auth.action";
import { getLastReadAt, getMessage } from "../messages.action";
import { getRoom } from "../room.action";
import { ChatRoom } from "./chat-room";
import { clientChatCache } from "@/lib/infrastructure/cache/client-cache";
import { Warning } from "@phosphor-icons/react/dist/ssr";
import LoadingRoom from "../room-skeleton";

export function ChatRoomClientWrapper({ roomId }: { roomId: string }) {
  const syncRoom = clientChatCache.getRoomSync(roomId);
  const syncMessages = clientChatCache.getMessagesSync(roomId);
  const syncLastRead = clientChatCache.getLastReadSync(roomId);

  const [messages, setMessages] = useState<any[]>(syncMessages || []);
  const [data, setData] = useState<{
    userId: string;
    roomData: any;
    initialMessages: any[];
    lastReadMessageId: string | null;
    lastReadAt: Date | null;
    user: any;
  } | null>(syncRoom ? {
    userId: "", // Will be hydrated securely via Server Action
    roomData: syncRoom,
    initialMessages: syncMessages || [],
    lastReadMessageId: syncLastRead.id,
    lastReadAt: syncLastRead.at,
    user: { id: "", username: "...", avatar: null }
  } : null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        // --- 1. LOCAL FIRST HYDRATION ---
        // Fetch from IndexedDB for zero-latency initial UI paint
        const cachedRoom = await clientChatCache.getRoom(roomId);
        const cachedMessages = await clientChatCache.getMessages(roomId);
        const cachedLastRead = await clientChatCache.getLastRead(roomId);
        const session = await getUserSession();
        const userId = session?.user?.id ?? "";

        if (cachedRoom && isMounted) {
          const initMessages = cachedMessages || [];
          setMessages(initMessages);
          setData({
            userId,
            roomData: cachedRoom,
            initialMessages: initMessages,
            lastReadMessageId: cachedLastRead?.id || null,
            lastReadAt: cachedLastRead?.at ?? null,
            user: { id: userId, username: "...", avatar: null }
          });
        }

        // --- 2. BACKGROUND SYNC OVER NETWORK ---
        const [roomResponse, initialMessagesResponse, lastReadResponse, userInfo] =
          await Promise.all([
            getRoom(roomId),
            getMessage(roomId, 50),
            getLastReadAt(userId, roomId),
            sidaBarUserInfo(),
          ]);

        if (roomResponse.status === "success" && roomResponse.data && isMounted) {
          const fetchedMessages = (initialMessagesResponse.status === "success" ? initialMessagesResponse.data : []) ?? [];
          const fetchedLastRead = lastReadResponse.status === "success" ? lastReadResponse.data : null;

          await clientChatCache.setRoom(roomId, roomResponse.data);
          await clientChatCache.setMessages(roomId, fetchedMessages);
          await clientChatCache.setLastRead(roomId, fetchedLastRead?.id || null, fetchedLastRead?.at ? new Date(fetchedLastRead.at) : null);

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
        } else if (!cachedRoom && isMounted) {
          setError("Gagal memuat room");
        }
      } catch (e) {
        console.error("Initialization error:", e);
        if (isMounted) setError("Terjadi kesalahan sistem");
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center space-y-4">
        <Warning weight="duotone" className="text-red-500 w-20 h-20" />
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
