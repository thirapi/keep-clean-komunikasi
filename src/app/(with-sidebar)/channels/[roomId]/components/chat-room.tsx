// src/app/(with-sidebar)/channels/[roomId]/components/chat-room.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { pusher } from "@/lib/pusher/pusher.client";
import {
  MessageRecord,
  MessageWithUserDTO,
} from "@/lib/entities/models/message.model";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ChatHeader } from "./chat-header";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface ChatRoomProps {
  userId: string;
  roomData: RoomWithParticipantsDTO;
  initialMessages: MessageWithUserDTO[];
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

export function ChatRoom({ userId, roomData, initialMessages }: ChatRoomProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageWithUserDTO | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        onToggleMembers={() => setShowMembers((prev) => !prev)}
        membersVisible={showMembers}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <MessageList
              messages={messages}
              bottomRef={bottomRef}
              onlineUserIds={onlineUserIds}
              onReply={(message) => setReplyingTo(message)}
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
          <aside className="w-64 border-l p-4 hidden lg:block">
            <h3 className="text-sm font-semibold text-zinc-500 mb-2">
              Members
            </h3>
            <ul className="space-y-3">
              {roomData.participants.map((user) => (
                <li key={user.id} className="flex items-center space-x-2">
                  <div className="relative">
                    <Avatar className="h-10 w-10 font-bold">
                      <AvatarFallback
                        style={{ backgroundColor: stringToColor(user.id) }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {onlineUserIds.includes(user.id) && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
                    )}
                  </div>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <span className="cursor-pointer">
                        {user.username}
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                          <AvatarFallback style={{ backgroundColor: stringToColor(user.id) }}>
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {user.username}
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
