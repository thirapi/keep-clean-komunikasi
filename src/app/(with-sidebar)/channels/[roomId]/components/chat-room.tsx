"use client";

import { useState, useEffect, useRef } from "react";
import { debounce } from "lodash";
import { pusher } from "@/lib/pusher/pusher.client";
import { getMessage, updateLastReadAt } from "../messages.action";

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

interface ChatRoomProps {
  userId: string;
  roomData: RoomWithParticipantsDTO;
  initialMessages: MessageWithUserDTO[];
  lastReadAt: Date | null;
}

export function ChatRoom({
  userId,
  roomData,
  initialMessages,
  lastReadAt,
}: ChatRoomProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageWithUserDTO | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isMobile = useIsMobile();

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const unreadRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const markAsRead = debounce(() => {
    updateLastReadAt(userId, roomData.id, new Date());
  }, 2000);

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
    const presenceChannel = pusher.subscribe(`presence-chat-${roomData.id}`);

    chatChannel.bind("new-message", (msg: MessageWithUserDTO) => {
      setMessages((prev) => [...prev, msg]);
    });

    presenceChannel.bind("pusher:subscription_succeeded", (members: any) => {
      const ids: string[] = [];
      members.each((member: any) => ids.push(member.id));
      setOnlineUserIds(ids);
    });

    presenceChannel.bind("pusher:member_added", (member: any) => {
      setOnlineUserIds((prev) => [...prev, member.id]);
    });

    presenceChannel.bind("pusher:member_removed", (member: any) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== member.id));
    });

    return () => {
      chatChannel.unbind_all();
      chatChannel.unsubscribe();
      presenceChannel.unbind_all();
      presenceChannel.unsubscribe();
    };
  }, [roomData.id]);

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
              lastReadAt={lastReadAt}
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
