import { useEffect, useRef } from "react";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";

export function useAutoScroll(
  messages: MessageWithUserDTO[],
  userId: string,
  isAtBottom: boolean,
  bottomRef: React.RefObject<HTMLDivElement | null>
) {
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isNewMessage = lastMessage?.id !== lastIdRef.current;

    if (isNewMessage) {
      if (lastMessage?.userId === userId || isAtBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      lastIdRef.current = lastMessage?.id ?? null;
    }
  }, [messages, userId, isAtBottom, bottomRef]);
}
