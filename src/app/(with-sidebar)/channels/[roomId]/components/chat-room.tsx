"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { debounce } from "lodash";
import { pusher } from "@/lib/pusher/pusher.client";
import { getMessage, updateLastReadAt } from "../messages.action";
import { useRouter } from "next/navigation";

import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";

import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ChatHeader } from "./chat-header";
import { MemberList } from "./member-list";
import { MobileMemberList } from "./mobile-member-list";
import { useScrollToInitial } from "./hooks/use-scroll-to-initial";
import { useAutoScroll } from "./hooks/use-auto-scroll";
import { useAutoFocusInput } from "./hooks/use-auto-focus-input";
import { useMarkAsRead } from "./hooks/use-mark-as-read";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePresence } from "@/components/presence-provider";

interface ChatRoomProps {
  userId: string;
  roomData: RoomWithParticipantsDTO;
  initialMessages: MessageWithUserDTO[];
  lastReadMessageId: string | null;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

export function ChatRoom({
  userId,
  roomData,
  initialMessages,
  lastReadMessageId,
  user,
}: ChatRoomProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [localRoomData, setLocalRoomData] = useState(roomData);
  const { onlineUserIds } = usePresence();
  const [showMembers, setShowMembers] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageWithUserDTO | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastReadIdState, setLastReadIdState] = useState<string | null>(lastReadMessageId);
  const isMobile = useIsMobile();
  const router = useRouter();

  const messagesRef = useRef(messages);
  const isInitialLoadRef = useRef(true); 

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const unreadRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesRef.current = messages;
    import("@/lib/infrastructure/cache/client-cache").then(m => {
      m.clientChatCache.setMessages(localRoomData.id, messages);
    });
  }, [messages, localRoomData.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const sendNotification = useCallback((msg: MessageWithUserDTO) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.08);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio context failed", e);
    }

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      !document.hasFocus()
    ) {
      new Notification(`${msg.user?.username ?? "Seseorang"} di #${roomData.name}`, {
        body: msg.content,
        icon: msg.user?.avatar || "/favicon.ico",
        tag: `msg-${roomData.id}`,
        silent: true,
      });
    }
  }, [roomData.name, roomData.id]);

  const handleNewMessage = useCallback((msg: MessageWithUserDTO, isFromSync = false) => {
    if (msg.userId !== userId && !isFromSync && !isInitialLoadRef.current) {
      sendNotification(msg);
    }
    setMessages((prev) => {
      const existingIndex = prev.findIndex((m) => {
        if (m.id === msg.id) return true;
        if (m.isOptimistic && m.userId === msg.userId) {
          return m.content.trim() === msg.content.trim();
        }
        return false;
      });

      let nextMessages: MessageWithUserDTO[];
      if (existingIndex > -1) {
        nextMessages = [...prev];
        nextMessages[existingIndex] = { ...msg, isOptimistic: false };
      } else {
        nextMessages = [...prev, msg];
      }

      import("@/lib/infrastructure/cache/client-cache").then(m => {
        m.clientChatCache.mergeMessages(localRoomData.id, [msg]);
      });

      return nextMessages;
    });
  }, [userId, localRoomData.id, sendNotification]);

  const markAsReadApi = useMemo(() => debounce(async () => {
    if (!userId || userId === "") return;
    const lastMessage = messagesRef.current[messagesRef.current.length - 1];
    if (!lastMessage) return;
    await updateLastReadAt(userId, roomData.id, lastMessage.id);
    router.refresh();
  }, 1500), [userId, roomData.id, router]);

  const markAsRead = useCallback(() => {
    if (!userId || userId === "") return;
    const lastMessage = messagesRef.current[messagesRef.current.length - 1];
    if (!lastMessage) return;
    setLastReadIdState(lastMessage.id);
    markAsReadApi();
  }, [userId, markAsReadApi]);

  const syncMessages = useCallback(async () => {
    const currentMessages = messagesRef.current;
    if (currentMessages.length === 0) return;

    const lastMessage = currentMessages[currentMessages.length - 1];
    const afterDate = new Date(lastMessage.createdAt);

    const response = await getMessage(roomData.id, 50, undefined, afterDate);
    if (response.status === "success" && response.data) {
      response.data.forEach((msg) => handleNewMessage(msg, true));
    }
  }, [roomData.id, handleNewMessage]);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;

    const viewport = viewportRef.current;
    const previousScrollHeight = viewport?.scrollHeight ?? 0;

    setIsLoadingMore(true);
    const oldestMessage = messages[0];
    const beforeDate = oldestMessage ? new Date(oldestMessage.createdAt) : undefined;

    const response = await getMessage(roomData.id, 50, beforeDate);
    if (response.status === "success" && response.data) {
      if (response.data.length < 50) setHasMore(false);
      setMessages((prev) => [...response.data!, ...prev]);

      setTimeout(() => {
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight - previousScrollHeight;
        }
      }, 0);
    }
    setIsLoadingMore(false);
  };

  useScrollToInitial(messages, unreadRef, bottomRef);
  useAutoScroll(messages, userId, isAtBottom, bottomRef);
  useAutoFocusInput(inputRef);
  useMarkAsRead(bottomRef, unreadRef, setIsAtBottom, markAsRead);

  useEffect(() => {
    const chatChannel = pusher.subscribe(`chat-${roomData.id}`);
    chatChannel.bind("new-message", (msg: MessageWithUserDTO) => handleNewMessage(msg));
    const handleConnected = () => syncMessages();
    pusher.connection.bind("connected", handleConnected);
    const handleFocus = () => syncMessages();
    window.addEventListener("focus", handleFocus);

    return () => {
      chatChannel.unbind_all();
      chatChannel.unsubscribe();
      pusher.connection.unbind("connected", handleConnected);
      window.removeEventListener("focus", handleFocus);
    };
  }, [roomData.id, handleNewMessage, syncMessages]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <ChatHeader
        roomData={localRoomData}
        currentUserId={userId}
        onToggleMembers={() => setShowMembers((prev) => !prev)}
        membersVisible={showMembers}
        onlineUserIds={onlineUserIds}
        onUpdateRoom={(data) => setLocalRoomData(prev => ({ ...prev, ...data }))}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <MessageList
              userId={userId}
              messages={messages}
              bottomRef={bottomRef}
              unreadRef={unreadRef}
              onlineUserIds={onlineUserIds}
              onReply={(message) => setReplyingTo(message)}
              lastReadMessageId={lastReadIdState}
              onLoadMore={loadMoreMessages}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              viewportRef={viewportRef}
              roomData={localRoomData}
            />
          </div>
          <MessageInput
            userId={userId}
            roomData={roomData}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            inputRef={inputRef}
            onNewMessage={(msg) => {
              handleNewMessage(msg);
              markAsRead();
            }}
            user={user}
          />
        </div>
        {showMembers && !isMobile && (
          <div className="hidden lg:block">
            <MemberList
              roomData={roomData}
              onlineUserIds={onlineUserIds}
              currentUserId={userId}
            />
          </div>
        )}
      </div>
      <MobileMemberList
        roomData={roomData}
        onlineUserIds={onlineUserIds}
        isOpen={showMembers && isMobile}
        onClose={() => setShowMembers(false)}
        currentUserId={userId}
      />
    </div>
  );
}
