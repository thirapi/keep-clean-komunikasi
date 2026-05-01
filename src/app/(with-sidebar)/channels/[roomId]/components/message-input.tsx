// src/app/(with-sidebar)/channels/[roomId]/components/message-input.tsx
"use client";

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { createMessage } from "@/app/(with-sidebar)/app/messages.action";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { debounce } from "lodash";
import { setTypingStatusAction } from "../messages.action";
import { pusher } from "@/lib/pusher/pusher.client";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { RoomRecord } from "@/lib/entities/models/room.model";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { CornerLeftUp, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  roomData: RoomRecord;
  replyingTo: MessageWithUserDTO | null;
  onCancelReply: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onNewMessage: (message: MessageWithUserDTO) => void;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

export function MessageInput({
  userId,
  roomData,
  replyingTo,
  onCancelReply,
  inputRef,
  onNewMessage,
  user,
}: Props) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { displayNames } = useTypingIndicator(roomData.id, userId);

  const sendTypingEvent = useRef(
    debounce(() => {
      setTypingStatusAction(userId, roomData.id, true);
    }, 300),
  ).current;

  const sendStopTypingEvent = useRef(
    debounce(() => {
      setTypingStatusAction(userId, roomData.id, false);
    }, 5000),
  ).current;

  // Auto-resize logic
  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [content, inputRef]);

  const handleTyping = useCallback(() => {
    if (!userId) return;
    sendTypingEvent();
    sendStopTypingEvent();
  }, [sendTypingEvent, sendStopTypingEvent, userId]);

  const handleSend = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!content.trim() || isSending || !userId) return;

      setIsSending(true);
      sendStopTypingEvent.cancel();
      if (userId) setTypingStatusAction(userId, roomData.id, false);

      // Optimistic message
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: MessageWithUserDTO = {
        id: optimisticId,
        content,
        userId,
        roomId: roomData.id,
        imageUrl: null,
        replyTo: replyingTo?.id || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOptimistic: true,
        user: {
          username: user.username,
          avatar: user.avatar,
        },
      } as any;

      onNewMessage(optimisticMessage);
      setContent("");
      const currentContent = content;
      const currentReplyTo = replyingTo?.id;
      onCancelReply();

      try {
        const response = await createMessage({
          userId,
          content: currentContent,
          roomId: roomData.id,
          replyTo: currentReplyTo,
        });

        if (response.status === "success" && response.data) {
          onNewMessage(response.data);
        } else {
          console.error("Gagal mengirim pesan:", response.error);
          toast.error(response.error?.message);
        }
      } finally {
        setIsSending(false);
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
      onNewMessage,
      user.username,
      user.avatar,
    ],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Prevent newline if content is empty or only whitespace
        if (!content.trim()) {
          e.preventDefault();
        }
      } else {
        e.preventDefault();
        handleSend();
      }
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
    <div className="flex flex-col gap-0 px-3 sm:px-6 pb-4 sm:pb-6">
      {replyingTo && (
        <div className="relative rounded-t-xl bg-muted/50 border-x border-t border-border/50 backdrop-blur-md px-4 py-3 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-primary/20 p-1.5 rounded-lg">
            <CornerLeftUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-primary mb-0.5">
              Replying to {replyingTo.user.username}
            </div>
            <div className="text-sm text-muted-foreground/80 line-clamp-1 italic">
              "{replyingTo.content}"
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div
        className={cn(
          "flex items-end gap-2 bg-muted/40 backdrop-blur-xl border border-border/50 p-1.5 pr-2 shadow-2xl transition-all duration-300 ring-1 ring-black/5",
          replyingTo ? "rounded-b-xl border-t-0" : "rounded-xl",
        )}
      >
        <div className="flex-1 relative flex items-center">
          <textarea
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
            placeholder={`Tulis pesan di #${roomData.name}`}
            className="flex-1 bg-transparent border-none text-foreground placeholder-muted-foreground/60 focus:outline-none ring-0 resize-none min-h-[40px] max-h-[200px] px-3 py-2.5 text-[14px] leading-relaxed overflow-y-auto"
            rows={1}
          />
        </div>

        <Button
          onClick={() => handleSend()}
          disabled={!content.trim() || isSending}
          className="h-9 w-9 p-0 mb-0.5 rounded-lg bg-primary hover:brightness-110 transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-30 disabled:grayscale"
        >
          {isSending ? (
            <div className="flex items-center justify-center gap-1">
              {[0, 0.2, 0.4].map((delay, i) => (
                <div
                  key={i}
                  className="h-1 w-1 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          ) : (
            <CornerLeftUp className="h-5 w-5 rotate-90" />
          )}
        </Button>
      </div>

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
