import { useEffect, useRef } from "react";

export function useMarkAsRead(
  bottomRef: React.RefObject<HTMLDivElement | null>,
  unreadRef: React.RefObject<HTMLDivElement | null>,
  setIsAtBottom: React.Dispatch<React.SetStateAction<boolean>>,
  markAsRead: () => void
) {
  const markAsReadRef = useRef(markAsRead);
  useEffect(() => {
    markAsReadRef.current = markAsRead;
  }, [markAsRead]);

  // Re-attach observer whenever the actual DOM element becomes available.
  // We poll because refs don't trigger re-renders when .current changes.
  useEffect(() => {
    let bottomObserver: IntersectionObserver | null = null;
    let unreadObserver: IntersectionObserver | null = null;

    const attach = () => {
      // Disconnect old observers first
      bottomObserver?.disconnect();
      unreadObserver?.disconnect();

      // Bottom div observer — tracks scroll position
      bottomObserver = new IntersectionObserver(
        ([entry]) => {
          setIsAtBottom(entry.isIntersecting);
          if (entry.isIntersecting) {
            markAsReadRef.current();
          }
        },
        { threshold: 0 }
      );

      // Unread separator observer — marks read when separator scrolls into view
      unreadObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            markAsReadRef.current();
          }
        },
        { threshold: 0 }
      );

      if (bottomRef.current) bottomObserver.observe(bottomRef.current);
      if (unreadRef.current) unreadObserver.observe(unreadRef.current);
    };

    // Initial attach
    attach();

    // Poll every 300ms for the first 3 seconds in case refs weren't ready
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if (attempts > 10) {
        clearInterval(poll);
        return;
      }
      attach();
    }, 300);

    return () => {
      clearInterval(poll);
      bottomObserver?.disconnect();
      unreadObserver?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsAtBottom]);
}
