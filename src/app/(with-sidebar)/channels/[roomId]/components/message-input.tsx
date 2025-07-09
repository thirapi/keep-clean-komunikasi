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
import { CornerLeftUp, Loader2, X } from "lucide-react";

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
  const [isSending, setIsSending] = useState(false);

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

      if (!content.trim() || isSending) return;

      setIsSending(true);
      sendStopTypingEvent.cancel();
      setTypingStatusAction(userId, roomData.id, false);

      try {
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
      } finally {
        setIsSending(false); // pastikan kembali normal meski gagal
      }
    },
    [
      content,
      isSending,
      userId,
      roomData.id,
      replyingTo?.id,
      onCancelReply,
      sendStopTypingEvent,
    ]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape" && replyingTo) {
      onCancelReply();
    }
  };

  useEffect(() => {
    return () => {
      sendTypingEvent.cancel();
      sendStopTypingEvent.cancel();
    };
  }, [sendTypingEvent, sendStopTypingEvent]);

  return (
    <div className="flex flex-col gap-1 px-2 sm:px-4 pb-2 sm:pb-4">
      {replyingTo && (
        <div className="relative rounded-md bg-muted border-l-4 border-blue-500 px-3 sm:px-4 py-2 sm:py-3 flex items-start gap-2 sm:gap-3 shadow-inner">
          <CornerLeftUp className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-primary">
              Replying to {replyingTo.user.username}
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2 break-words">
              {replyingTo.content}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 absolute top-2 right-2"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="pt-2 border-t border-border flex gap-2 backdrop-blur-md bg-muted border rounded-xl p-2 shadow-lg items-center"
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
          placeholder={`Message #${roomData.name}`}
          className="flex-1 bg-transparent border-none text-foreground placeholder-muted-foreground focus:outline-none"
        />
        <Button
          type="submit"
          disabled={!content.trim() || isSending}
          className="ml-2 p-2 rounded-lg bg-gradient-to-br from-[#5865f2] to-[#4752c4] text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5865f2] hover:shadow-md shadow-[#5865f2]/30"
        >
          {isSending ? (
            <div className="flex items-center justify-center gap-1">
              {[0, 0.2, 0.4].map((delay, i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          ) : (
            <CornerLeftUp className="h-5 w-5" />
          )}
        </Button>
      </form>

      <div className="h-5 text-sm text-muted-foreground italic transition-opacity duration-200 ease-in-out flex items-center">
        {displayNames.length > 0 && (
          <div className="flex items-center">
            <span>
              {displayNames.join(", ")} {displayNames.length > 1 ? "are" : "is"}{" "}
              typing
            </span>
            <div className="flex items-center justify-center gap-0.5 pl-1 pt-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
