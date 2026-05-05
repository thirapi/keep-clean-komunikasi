import { useEffect, useRef, useState } from "react";

export function useMarkAsRead(
  bottomRef: React.RefObject<HTMLDivElement | null>,
  viewportRef: React.RefObject<HTMLDivElement | null>,
  setIsAtBottom: React.Dispatch<React.SetStateAction<boolean>>,
  markAsRead: (messageId?: string) => void
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
    let messageObserver: IntersectionObserver | null = null;

    const attach = () => {
      bottomObserver?.disconnect();
      messageObserver?.disconnect();

      // Bottom observer to track if we're at the end of the chat
      bottomObserver = new IntersectionObserver(
        ([entry]) => {
          setIsAtBottom(entry.isIntersecting);
          if (entry.isIntersecting) {
            markAsReadRef.current(); // Mark all as read if we reached the bottom
          }
        },
        { 
          root: viewportRef.current,
          threshold: 0 
        }
      );

      // Message observer to mark individual messages as read as they enter the viewport
      messageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const messageId = entry.target.getAttribute("data-message-id");
              if (messageId) {
                markAsReadRef.current(messageId);
              }
            }
          });
        },
        { 
          root: viewportRef.current,
          threshold: 0.1, // Mark as read when 10% of the message is visible
          rootMargin: "0px 0px -10% 0px" // Slightly before it hits bottom
        }
      );

      if (bottomRef.current) bottomObserver.observe(bottomRef.current);
      
      // Observe all message containers
      const messageElements = viewportRef.current?.querySelectorAll(".message-container");
      messageElements?.forEach((el) => messageObserver?.observe(el));
    };

    attach();

    // Re-attach when new messages might have been added
    // We use MutationObserver to watch for new message elements
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
    };
  }, [isReady, bottomRef, viewportRef, setIsAtBottom]);
}
