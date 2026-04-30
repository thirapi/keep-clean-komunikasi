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
  lastReadAt: Date | null;
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
  lastReadAt,
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
  const [lastReadState, setLastReadAt] = useState<Date | null>(lastReadAt);
  const isMobile = useIsMobile();
  const router = useRouter();

  const messagesRef = useRef(messages);
  const isInitialLoadRef = useRef(true); // Prevent notification on initial/sync load

  useEffect(() => {
    messagesRef.current = messages;
    // Save to cache for offline/instant load
    import("@/lib/infrastructure/cache/client-cache").then(m => {
      m.clientChatCache.setMessages(localRoomData.id, messages);
    });
  }, [messages, localRoomData.id]);

  // Mark initial load as done after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 1500); // Grace period for initial sync
    return () => clearTimeout(timer);
  }, []);

  // Sync initialMessages when it change (e.g. from cache to server sync)
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const unreadRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // markAsRead: update state immediately, debounce the API call only
  const markAsReadApi = useMemo(() => debounce(async () => {
    if (!userId || userId === "") return;
    await updateLastReadAt(userId, roomData.id, new Date());
    router.refresh(); // Sync sidebar unread count
  }, 1500), [userId, roomData.id, router]);

  const markAsRead = useCallback(() => {
    if (!userId || userId === "") return;
    // Update visually immediately
    setLastReadAt(new Date());
    // Debounce the actual API call
    markAsReadApi();
  }, [userId, markAsReadApi]);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const sendNotification = useCallback((msg: MessageWithUserDTO) => {
    // 1. Play in-app sound
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

    // 2. Show browser notification only when tab is not focused
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      !document.hasFocus()
    ) {
      new Notification(`${msg.user?.username ?? "Seseorang"} di #${roomData.name}`, {
        body: msg.content,
        icon: msg.user?.avatar || "/favicon.ico",
        tag: `msg-${roomData.id}`, // Group by channel to avoid spam
        silent: true, // We already played our own sound
      });
    }
  }, [roomData.name, roomData.id]);

  const handleNewMessage = useCallback((msg: MessageWithUserDTO, isFromSync = false) => {
    if (msg.userId !== userId && !isFromSync && !isInitialLoadRef.current) {
      sendNotification(msg);
    }
    setMessages((prev) => {
      // Check if we already have this message (real or optimistic)
      const existingIndex = prev.findIndex((m) => {
        // Match by ID (for real/synced messages)
        if (m.id === msg.id) return true;

        // Match by optimistic properties (for replacing our own optimistic message)
        if (m.isOptimistic && m.userId === msg.userId) {
          const mTrimmed = m.content.trim();
          const msgTrimmed = msg.content.trim();
          return mTrimmed === msgTrimmed;
        }

        return false;
      });

      if (existingIndex > -1) {
        const newMessages = [...prev];
        // Replace the existing one (could be original optimistic or older real)
        newMessages[existingIndex] = {
          ...msg,
          isOptimistic: false, // Ensure it's marked as non-optimistic
        };
        return newMessages;
      }

      return [...prev, msg];
    });
  }, []);

  const syncMessages = useCallback(async () => {
    const currentMessages = messagesRef.current;
    if (currentMessages.length === 0) return;

    const lastMessage = currentMessages[currentMessages.length - 1];
    const afterDate = new Date(lastMessage.createdAt);

    const response = await getMessage(roomData.id, 50, undefined, afterDate);

    if (response.status === "success" && response.data) {
      const newMessages = response.data;
      if (newMessages.length > 0) {
        // Pass isFromSync=true to suppress notification sound
        newMessages.forEach((msg) => handleNewMessage(msg, true));
      }
    }
  }, [roomData.id, handleNewMessage]);

  const handleCancelReply = () => setReplyingTo(null);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;

    const viewport = viewportRef.current;
    const previousScrollHeight = viewport?.scrollHeight ?? 0;

    setIsLoadingMore(true);
    const oldestMessage = messages[0];
    const beforeDate = oldestMessage
      ? new Date(oldestMessage.createdAt)
      : undefined;

    const response = await getMessage(roomData.id, 50, beforeDate);

    if (response.status === "success" && response.data) {
      const newMessages = response.data;
      if (newMessages.length < 50) {
        setHasMore(false);
      }
      setMessages((prev) => [...newMessages, ...prev]);

      // Maintain scroll position
      setTimeout(() => {
        if (viewport) {
          const newScrollHeight = viewport.scrollHeight;
          viewport.scrollTop = newScrollHeight - previousScrollHeight;
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

    chatChannel.bind("new-message", (msg: MessageWithUserDTO) => {
      handleNewMessage(msg);
    });

    // Handle Pusher reconnection
    const handleConnected = () => {
      syncMessages();
    };

    pusher.connection.bind("connected", handleConnected);

    // Handle Window Focus
    const handleFocus = () => {
      syncMessages();
    };
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
      {/* full height layout */}
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
              lastReadAt={lastReadState}
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
            onCancelReply={handleCancelReply}
            inputRef={inputRef}
            onNewMessage={handleNewMessage}
            user={user}
          />
        </div>

        {/* Desktop member list */}
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
      {/* Mobile member list */}
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
