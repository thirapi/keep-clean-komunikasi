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

  // Auto scroll untuk pesan baru
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isNewMessage = lastMessage?.id !== lastIdRef.current;

    if (isNewMessage) {
      // Jika pesan dari user sendiri, kita paksa geser halus ke bawah meski ia sedang scroll di atas
      if (lastMessage?.userId === userId) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      // Jika wasAtBottomRef.current true, CSS flex-col-reverse sudah MENGONTROL secara otomatis tanpa JS.

      lastIdRef.current = lastMessage?.id ?? null;
    }
  }, [messages, userId, bottomRef]);

  // Hapus ResizeObserver: 
  // CSS modern (flex-col-reverse + overflow-anchor) sudah natively menangani load gambar telat
  // tanpa perlu kalkulasi Javascript yang memberatkan memori.
}
