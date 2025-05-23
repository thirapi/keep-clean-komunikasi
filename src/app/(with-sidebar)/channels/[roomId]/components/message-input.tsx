// src/app/(with-sidebar)/channels/[roomId]/components/message-input.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createMessage } from "@/app/(with-sidebar)/app/messages.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { debounce } from "lodash";
import { setTypingStatusAction } from "../messages.action";
import { pusher } from "@/lib/pusher/pusher.client";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { RoomRecord } from "@/lib/entities/models/room.model";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { CornerLeftUp, X } from "lucide-react";

interface Props {
  userId: string;
  roomData: RoomRecord;
  replyingTo: MessageWithUserDTO | null;
  onCancelReply: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function MessageInput({
  userId,
  roomData,
  replyingTo,
  onCancelReply,
  inputRef,
}: Props) {
  const [content, setContent] = useState("");

  const { displayNames } = useTypingIndicator(roomData.id, userId);

  const sendTypingEvent = useRef(
    debounce(() => {
      setTypingStatusAction(userId, roomData.id, true);
    }, 300)
  ).current;

  const sendStopTypingEvent = useRef(
    debounce(() => {
      setTypingStatusAction(userId, roomData.id, false);
    }, 5000)
  ).current;

  const handleTyping = useCallback(() => {
    sendTypingEvent();
    sendStopTypingEvent();
  }, [sendTypingEvent, sendStopTypingEvent]);

  const handleSend = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!content.trim()) return;

      sendStopTypingEvent.cancel();
      setTypingStatusAction(userId, roomData.id, false);

      const response = await createMessage({
        userId,
        content,
        roomId: roomData.id,
        replyTo: replyingTo?.id,
      });

      if (response.status === "success") {
        setContent("");
        onCancelReply();
      } else {
        console.error("Gagal mengirim pesan:", response.error);
        toast.error(response.error?.message);
      }
    },
    [content, userId, roomData.id, sendStopTypingEvent]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      sendTypingEvent.cancel();
      sendStopTypingEvent.cancel();
    };
  }, [sendTypingEvent, sendStopTypingEvent]);

  return (
    <div className="flex flex-col gap-1 px-4 pb-4">
      {replyingTo && (
        <div className="bg-muted border-l-2 border-blue-500 rounded-md p-3 flex items-start gap-3 relative">
          <CornerLeftUp className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium mb-1">
              Replying to {replyingTo.user.username}
            </div>
            <div className="text-muted-foreground text-sm line-clamp-2 break-words">
              {replyingTo.content}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 absolute top-2 right-2"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <form
        onSubmit={handleSend}
        className="pt-2 border-t border-[#1e1f22] flex gap-2"
      >
        <Input
          autoFocus
          ref={inputRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onBlur={() => {
            sendStopTypingEvent();
          }}
          onKeyDown={handleKeyDown}
          type="text"
          placeholder={`"Message #${roomData.name}"`}
          className="flex-1 px-4 py-2 rounded-md bg-[#1e1f22] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
        />
        <Button
          type="submit"
          disabled={!content.trim()}
          className="px-4 py-2 bg-[#5865f2] text-white rounded-md hover:bg-[#4752c4] disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          send
        </Button>
      </form>

      <div className="h-1.5 text-sm text-gray-400 italic transition-opacity duration-200 ease-in-out">
        {displayNames.length > 0 && (
          <span>
            {displayNames.join(", ")} {displayNames.length > 1 ? "are" : "is"}{" "}
            typing...
          </span>
        )}
      </div>
    </div>
  );
}
