import { useEffect } from "react";

export function useAutoFocusInput(
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTypingAreaFocused =
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA" ||
          document.activeElement.getAttribute("contenteditable") === "true");

      if (!isTypingAreaFocused && inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputRef]);
}
