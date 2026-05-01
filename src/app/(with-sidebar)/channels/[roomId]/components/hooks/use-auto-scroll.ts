import { useEffect, useRef } from "react";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";

export function useAutoScroll(
  messages: MessageWithUserDTO[],
  userId: string,
  isAtBottom: boolean,
  bottomRef: React.RefObject<HTMLDivElement | null>
) {
  const lastIdRef = useRef<string | null>(null);
  const wasAtBottomRef = useRef(isAtBottom);

  // Sync ref with state
  useEffect(() => {
    wasAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  // Initial scroll and new message scroll
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isNewMessage = lastMessage?.id !== lastIdRef.current;

    if (isNewMessage) {
      if (lastMessage?.userId === userId || wasAtBottomRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      lastIdRef.current = lastMessage?.id ?? null;
    }
  }, [messages, userId, bottomRef]);

  // Handle height changes (images loading, etc)
  useEffect(() => {
    const container = bottomRef.current?.parentElement;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (wasAtBottomRef.current) {
        // Use behavior: "auto" (instant) for height changes to stay pinned to bottom
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      }
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [bottomRef]);
}
