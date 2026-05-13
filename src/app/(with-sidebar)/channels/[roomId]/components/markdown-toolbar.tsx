"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bold, Italic, Strikethrough, Code, Quote, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onApplyMarkdown: (content: string) => void;
}

export function MarkdownToolbar({ textareaRef, onApplyMarkdown }: MarkdownToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const updateToolbar = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const rect = textarea.getBoundingClientRect();

      setPosition({
        top: rect.top - 50,
        left: rect.left + (rect.width / 2) - 100,
      });

      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [textareaRef]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelectionChange = () => {
      if (document.activeElement === textarea) {
        updateToolbar();
      } else {
        setIsVisible(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (!toolbarRef.current?.contains(document.activeElement)) {
          setIsVisible(false);
        }
      }, 150);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    textarea.addEventListener("keydown", handleKeyDown);
    textarea.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      textarea.removeEventListener("keydown", handleKeyDown);
      textarea.removeEventListener("blur", handleBlur);
    };
  }, [textareaRef, updateToolbar]);

  const applyInlineMarkdown = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const before = text.substring(0, start);
    const after = text.substring(end);

    let newSelectedText = "";
    
    // If multiple lines are selected and we are applying inline code (backticks),
    // wrap each line individually to match Discord behavior
    if (prefix === "`" && selectedText.includes("\n")) {
      newSelectedText = selectedText
        .split("\n")
        .map(line => line.trim() ? `${prefix}${line}${suffix}` : line)
        .join("\n");
    } else {
      newSelectedText = `${prefix}${selectedText}${suffix}`;
    }

    const newContent = `${before}${newSelectedText}${after}`;
    onApplyMarkdown(newContent);

    setTimeout(() => {
      textarea.focus();
      const newStart = start + prefix.length;
      const newEnd = start + newSelectedText.length - suffix.length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 10);
  };

  const applyCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const before = text.substring(0, start);
    const after = text.substring(end);

    // Ensure code fence starts on a new line
    const needsNewlineBefore = before.length > 0 && !before.endsWith("\n");
    const needsNewlineAfter = after.length > 0 && !after.startsWith("\n");

    const prefix = (needsNewlineBefore ? "\n" : "") + "```\n";
    const suffix = "\n```" + (needsNewlineAfter ? "\n" : "");

    const newContent = `${before}${prefix}${selectedText}${suffix}${after}`;
    onApplyMarkdown(newContent);

    // Use requestAnimationFrame to ensure the textarea has rendered the new content
    requestAnimationFrame(() => {
      textarea.focus();
      const newStart = before.length + prefix.length;
      const newEnd = newStart + selectedText.length;
      textarea.setSelectionRange(newStart, newEnd);
    });
  };

  const applyQuote = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const before = text.substring(0, start);
    const after = text.substring(end);

    // Apply "> " to each line of the selection
    const quotedText = selectedText
      .split("\n")
      .map(line => `> ${line}`)
      .join("\n");

    const newContent = `${before}${quotedText}${after}`;
    onApplyMarkdown(newContent);

    setTimeout(() => {
      textarea.focus();
      const newEnd = before.length + quotedText.length;
      textarea.setSelectionRange(before.length, newEnd);
    }, 10);
  };

  const toolbar = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: 5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.95 }}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            zIndex: 9999,
          }}
          className="flex items-center gap-0.5 bg-[#1E1F22] border border-white/10 shadow-2xl rounded-lg p-1 px-1.5 ring-1 ring-black/50"
        >
          <ToolbarButton
            onClick={() => applyInlineMarkdown("**")}
            icon={<Bold className="h-3.5 w-3.5" />}
            label="Bold"
          />
          <ToolbarButton
            onClick={() => applyInlineMarkdown("_")}
            icon={<Italic className="h-3.5 w-3.5" />}
            label="Italic"
          />
          <ToolbarButton
            onClick={() => applyInlineMarkdown("~~")}
            icon={<Strikethrough className="h-3.5 w-3.5" />}
            label="Strikethrough"
          />
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <ToolbarButton
            onClick={applyQuote}
            icon={<Quote className="h-3.5 w-3.5" />}
            label="Quote"
          />
          <ToolbarButton
            onClick={() => applyInlineMarkdown("`")}
            icon={<Code className="h-3.5 w-3.5" />}
            label="Inline Code (`)"
          />
          <ToolbarButton
            onClick={applyCodeBlock}
            icon={<Terminal className="h-3.5 w-3.5" />}
            label="Code Block (```)"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(toolbar, document.body);
}

function ToolbarButton({ onClick, icon, label }: { onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="h-7 w-7 text-[#DBDEE1] hover:text-white hover:bg-white/10 transition-colors"
      title={label}
    >
      {icon}
    </Button>
  );
}
