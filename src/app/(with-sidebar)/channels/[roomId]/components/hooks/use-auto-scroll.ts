import { useEffect } from "react";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";

export function useAutoScroll(
  messages: MessageWithUserDTO[],
  userId: string,
  isAtBottom: boolean,
  bottomRef: React.RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage?.userId === userId || isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
}
