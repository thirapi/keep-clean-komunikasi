import { useEffect, useRef, useState } from "react";

export function useMarkAsRead(
  bottomRef: React.RefObject<HTMLDivElement | null>,
  unreadRef: React.RefObject<HTMLDivElement | null>,
  setIsAtBottom: React.Dispatch<React.SetStateAction<boolean>>,
  markAsRead: () => void
) {
  const markAsReadRef = useRef(markAsRead);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    markAsReadRef.current = markAsRead;
  }, [markAsRead]);

  // Give the UI a moment to settle
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let bottomObserver: IntersectionObserver | null = null;
    let unreadObserver: IntersectionObserver | null = null;

    // Check visibility manually on load
    const checkVisibility = () => {
      // If unread separator is in view, mark as read
      if (unreadRef.current) {
        const rect = unreadRef.current.getBoundingClientRect();
        const isInViewport = rect.top >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight);
        if (isInViewport) {
          markAsReadRef.current();
          return;
        }
      }
      
      // If already at bottom, mark as read
      if (bottomRef.current) {
        const rect = bottomRef.current.getBoundingClientRect();
        const isInViewport = rect.top >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight);
        if (isInViewport) {
          markAsReadRef.current();
        }
      }
    };

    const attach = () => {
      bottomObserver?.disconnect();
      unreadObserver?.disconnect();

      bottomObserver = new IntersectionObserver(
        ([entry]) => {
          setIsAtBottom(entry.isIntersecting);
          if (entry.isIntersecting) {
            markAsReadRef.current();
          }
        },
        { threshold: 0 }
      );

      unreadObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            markAsReadRef.current();
          }
        },
        { threshold: 0, rootMargin: "0px 0px -5% 0px" } // Mark read slightly before it leaves bottom
      );

      if (bottomRef.current) bottomObserver.observe(bottomRef.current);
      if (unreadRef.current) unreadObserver.observe(unreadRef.current);
    };

    attach();
    checkVisibility();

    return () => {
      bottomObserver?.disconnect();
      unreadObserver?.disconnect();
    };
  }, [isReady, bottomRef, unreadRef, setIsAtBottom]);
}
