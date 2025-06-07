"use client";

import { useState, useEffect, useRef } from "react";
import { debounce } from "lodash";
import { pusher } from "@/lib/pusher/pusher.client";
import { updateLastReadAt } from "../messages.action";

import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";

import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ChatHeader } from "./chat-header";
import { MemberList } from "./member-list";

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
  // === State ===
  const [messages, setMessages] = useState(initialMessages);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageWithUserDTO | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // === Refs ===
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const unreadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // === Function: menandai pesan sudah dibaca (debounced) ===
  const markAsRead = debounce(() => {
    updateLastReadAt(userId, roomData.id, new Date());
  }, 2000);

  // === Function: batal membalas pesan ===
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // === Scroll ke pesan terakhir atau pesan unread saat pertama kali render ===
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const hasUnread = unreadRef.current !== null;

    const timeout = setTimeout(() => {
      if (hasUnread) {
        unreadRef.current?.scrollIntoView({
          behavior: "auto",
          block: "center",
        });
      } else {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      }
    }, 50);

    return () => clearTimeout(timeout);
  }, []);

  // === Scroll otomatis ke bawah jika ada pesan baru dari user sendiri atau saat user berada di bawah ===
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage?.userId === userId || isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // === Auto-focus input saat tekan keyboard kecuali sedang fokus input lain ===
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

  // === Pantau apakah user berada di bawah chat menggunakan IntersectionObserver ===
  useEffect(() => {
    if (!bottomRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
        if (entry.isIntersecting) {
          markAsRead();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(bottomRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // === Setup Pusher untuk menerima pesan baru & status online member ===
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

  // === UI ===
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
              unreadRef={unreadRef}
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
