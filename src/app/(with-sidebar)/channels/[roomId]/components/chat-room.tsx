// src/app/(with-sidebar)/channels/[roomId]/components/chat-room.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { pusher } from "@/lib/pusher/pusher.client";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ChatHeader } from "./chat-header";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { updateLastReadAt } from "../messages.action";
import { MemberList } from "./member-list";
import { debounce } from "lodash";

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

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const markAsRead = debounce(() => {
    updateLastReadAt(userId, roomData.id, new Date());
  }, 2000);

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTypingAreaFocused =
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA" ||
          document.activeElement.getAttribute("contenteditable") === "true");

      if (!isTypingAreaFocused && inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // useEffect(() => {
  //   if (!userId || !roomData?.id || messages.length === 0) return;

  //   const lastMessageAt = new Date(messages[messages.length - 1].createdAt);
  //   if (!lastReadAt || lastMessageAt > new Date(lastReadAt)) {
  //     updateLastReadAt(userId, roomData.id, new Date());
  //   }
  // }, [userId, roomData?.id, messages]);

  useEffect(() => {
    if (!bottomRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          markAsRead(); // hanya update kalau user lihat area bawah
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(bottomRef.current);

    return () => observer.disconnect();
  }, [bottomRef.current]);

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
    <div className="flex flex-col h-screen max-h-[calc(100vh-5rem)]">
      <ChatHeader
        roomData={roomData}
        currentUserId={userId}
        onToggleMembers={() => setShowMembers((prev) => !prev)}
        membersVisible={showMembers}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <MessageList
              userId={userId}
              messages={messages}
              bottomRef={bottomRef}
              onlineUserIds={onlineUserIds}
              onReply={(message) => setReplyingTo(message)}
              lastReadAt={lastReadAt}
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
        {showMembers && (
          <MemberList roomData={roomData} onlineUserIds={onlineUserIds} />
        )}
      </div>
    </div>
  );
}
