"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
    avatar: string | null;
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
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const unreadRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const markAsRead = debounce(async () => {
    await updateLastReadAt(userId, roomData.id, new Date());
    setLastReadAt(new Date());
    router.refresh(); // Sync sidebar
  }, 2000);

  const handleNewMessage = useCallback((msg: MessageWithUserDTO) => {
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
        newMessages.forEach((msg) => handleNewMessage(msg));
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
  useMarkAsRead(bottomRef, setIsAtBottom, markAsRead);

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
      {" "}
      {/* full height layout */}
      <ChatHeader
        roomData={roomData}
        currentUserId={userId}
        onToggleMembers={() => setShowMembers((prev) => !prev)}
        membersVisible={showMembers}
        onlineUserIds={onlineUserIds}
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
            <MemberList roomData={roomData} onlineUserIds={onlineUserIds} />
          </div>
        )}
      </div>
      {/* Mobile member list */}
      <MobileMemberList
        roomData={roomData}
        onlineUserIds={onlineUserIds}
        isOpen={showMembers && isMobile}
        onClose={() => setShowMembers(false)}
      />
    </div>
  );
}
