"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { debounce } from "lodash";
import { pusher } from "@/lib/pusher/pusher.client";
import { getMessage, updateLastReadAt } from "../messages.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { useUnread } from "@/components/unread-provider";

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
  const { markAsRead: markSidebarAsRead } = useUnread();
  const [showMembers, setShowMembers] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageWithUserDTO | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastReadIdState, setLastReadIdState] = useState<string | null>(lastReadMessageId);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const router = useRouter();

  const messagesRef = useRef(messages);
  const lastPersistedReadIdRef = useRef<string | null>(lastReadMessageId);
  const isInitialLoadRef = useRef(true); 

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const unreadRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync state with props when they change (e.g. after server fetch in wrapper)
  useEffect(() => {
    setLastReadIdState(lastReadMessageId);
    // Only update persisted ref if it's null or the prop is newer (this is tricky)
    // For simplicity, if prop arrives from server, we assume server knows it
    lastPersistedReadIdRef.current = lastReadMessageId;
  }, [lastReadMessageId]);

  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    } else {
      toast.info("Pesan tidak ditemukan di tampilan saat ini");
    }
  }, []);

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
      const audio = new Audio("/sounds/message-notification.mp3");
      audio.play().catch((e) => console.warn("Audio play failed", e));
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
    
    // If the message is from the current user, treat it as read automatically
    if (msg.userId === userId) {
      setLastReadIdState(msg.id);
      // Sync to cache immediately for current user's messages
      import("@/lib/infrastructure/cache/client-cache").then(m => {
        m.clientChatCache.setLastRead(localRoomData.id, msg.id);
      });
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
    if (!lastMessage || lastMessage.id === lastPersistedReadIdRef.current) return;
    
    const messageId = lastMessage.id;
    
    // Update local state and persisted ref
    setLastReadIdState(messageId);
    lastPersistedReadIdRef.current = messageId;
    
    // Sync to sidebar and cache
    markSidebarAsRead(roomData.id);
    import("@/lib/infrastructure/cache/client-cache").then(m => {
      m.clientChatCache.setLastRead(roomData.id, messageId);
    });
    
    // Server update
    updateLastReadAt(userId, roomData.id, messageId).catch(console.error);
  }, 1000), [userId, roomData.id, markSidebarAsRead]);

  // Ensure read state is flushed on unmount/visibility hidden
  useEffect(() => {
    const flushReadState = async () => {
      const lastMessage = messagesRef.current[messagesRef.current.length - 1];
      if (lastMessage && lastMessage.id !== lastPersistedReadIdRef.current) {
        const messageId = lastMessage.id;
        lastPersistedReadIdRef.current = messageId;
        
        markSidebarAsRead(roomData.id);
        updateLastReadAt(userId, roomData.id, messageId).catch(console.error);
        
        // Also update cache on flush
        import("@/lib/infrastructure/cache/client-cache").then(m => {
          m.clientChatCache.setLastRead(roomData.id, messageId);
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushReadState();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      flushReadState(); // Flush on unmount
    };
  }, [userId, roomData.id, markSidebarAsRead]);

  const markAsRead = useCallback(() => {
    if (!userId || userId === "") return;
    markAsReadApi();
  }, [markAsReadApi]);

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

  const handleMessageSend = useCallback((msg: MessageWithUserDTO) => {
    handleNewMessage(msg);
    markAsRead();
  }, [handleNewMessage, markAsRead]);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

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
              highlightedMessageId={highlightedMessageId}
              onScrollToMessage={scrollToMessage}
            />
          </div>
          <MessageInput
            userId={userId}
            roomData={roomData}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            inputRef={inputRef}
            onNewMessage={handleMessageSend}
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
