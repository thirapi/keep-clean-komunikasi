import { useEffect } from "react";

export function useMarkAsRead(
  bottomRef: React.RefObject<HTMLDivElement | null>,
  setIsAtBottom: React.Dispatch<React.SetStateAction<boolean>>,
  markAsRead: () => void
) {
  useEffect(() => {
    if (!bottomRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
        if (entry.isIntersecting) {
          markAsRead();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(bottomRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);
}
