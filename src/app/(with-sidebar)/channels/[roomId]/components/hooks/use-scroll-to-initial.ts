import { useEffect } from "react";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";

export function useScrollToInitial(
  messages: MessageWithUserDTO[],
  unreadRef: React.RefObject<HTMLDivElement | null>,
  bottomRef: React.RefObject<HTMLDivElement | null>
) {
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
}
