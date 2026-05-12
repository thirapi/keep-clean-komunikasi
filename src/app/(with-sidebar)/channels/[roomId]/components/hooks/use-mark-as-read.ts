import { useEffect, useRef, useState } from "react";

export function useMarkAsRead(
  bottomRef: React.RefObject<HTMLDivElement | null>,
  viewportRef: React.RefObject<HTMLDivElement | null>,
  setIsAtBottom: React.Dispatch<React.SetStateAction<boolean>>,
  markAsRead: (messageId?: string) => void
) {
  const markAsReadRef = useRef(markAsRead);
  const [isReady, setIsReady] = useState(false);
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

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
    let messageObserver: IntersectionObserver | null = null;

    const attach = () => {
      bottomObserver?.disconnect();
      messageObserver?.disconnect();

      // Bottom observer to track if we're at the end of the chat
      bottomObserver = new IntersectionObserver(
        ([entry]) => {
          setIsAtBottom(entry.isIntersecting);
          if (entry.isIntersecting) {
            // Immediately mark all as read if we reach bottom
            markAsReadRef.current();
          }
        },
        { 
          root: viewportRef.current,
          threshold: 0 
        }
      );

      // Message observer to mark individual messages as read with throttle/delay
      messageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const messageId = entry.target.getAttribute("data-message-id");
            if (!messageId) return;

            if (entry.isIntersecting) {
              // Start a timer to mark as read if it stays in view
              if (!timersRef.current[messageId]) {
                timersRef.current[messageId] = setTimeout(() => {
                  markAsReadRef.current(messageId);
                  delete timersRef.current[messageId];
                }, 600); // Reduced to 600ms for near-instant feedback
              }
            } else {
              // If it leaves the viewport before the timer finishes, cancel it
              if (timersRef.current[messageId]) {
                clearTimeout(timersRef.current[messageId]);
                delete timersRef.current[messageId];
              }
            }
          });
        },
        { 
          root: viewportRef.current,
          threshold: 0.01, // 1% visible is enough to trigger "read"
          rootMargin: "0px"
        }
      );

      if (bottomRef.current) bottomObserver.observe(bottomRef.current);
      
      const messageElements = viewportRef.current?.querySelectorAll(".message-container");
      messageElements?.forEach((el) => messageObserver?.observe(el));
    };

    attach();

    const mutationObserver = new MutationObserver(() => {
      const messageElements = viewportRef.current?.querySelectorAll(".message-container");
      messageElements?.forEach((el) => messageObserver?.observe(el));
    });

    if (viewportRef.current) {
      mutationObserver.observe(viewportRef.current, { childList: true, subtree: true });
    }

    return () => {
      bottomObserver?.disconnect();
      messageObserver?.disconnect();
      mutationObserver.disconnect();
      // Cleanup all timers on unmount
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, [isReady, bottomRef, viewportRef, setIsAtBottom]);
}
