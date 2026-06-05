"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isRangeSelection,
    SELECTION_CHANGE_COMMAND,
    COMMAND_PRIORITY_LOW,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TextB, TextItalic, TextStrikethrough, Code, Terminal } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const TOOLBAR_GAP = 8;

export function FloatingToolbarPlugin() {
    const [editor] = useLexicalComposerContext();
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const toolbarRef = useRef<HTMLDivElement>(null);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            const rootElement = editor.getRootElement();
            if (!rootElement) return;

            // Use the EDITOR CONTAINER position, not selection position.
            // This prevents the toolbar from floating away when content is scrolled.
            const editorRect = rootElement.getBoundingClientRect();
            const toolbarWidth = toolbarRef.current?.offsetWidth || 240;

            // Position: centered above the editor input
            const top = editorRect.top - TOOLBAR_GAP - 36;
            const left = editorRect.left + editorRect.width / 2 - toolbarWidth / 2;

            setPosition({
                top: Math.max(8, top),
                left: Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8)),
            });
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [editor]);

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                updateToolbar();
            });
        });
    }, [editor, updateToolbar]);

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            () => {
                updateToolbar();
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor, updateToolbar]);

    const wrapSelection = (symbol: string) => {
        editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            const selectedText = selection.getTextContent();
            if (!selectedText) return;
            selection.removeText();
            selection.insertRawText(`${symbol}${selectedText}${symbol}`);
        });
    };

    const wrapInlineCode = () => {
        wrapSelection("`");
    };

    const wrapCodeBlock = () => {
        editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            const selectedText = selection.getTextContent();
            if (!selectedText) return;
            selection.removeText();
            selection.insertRawText(`\`\`\`\n${selectedText}\n\`\`\``);
        });
    };

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={toolbarRef}
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    style={{
                        position: "fixed",
                        top: position.top,
                        left: position.left,
                        zIndex: 9999,
                    }}
                    className="flex items-center gap-0.5 bg-[#1E1F22] border border-white/10 shadow-2xl rounded-lg p-1 px-1.5 ring-1 ring-black/50"
                >
                    <ToolbarButton
                        onClick={() => wrapSelection("**")}
                        icon={<TextB weight="duotone" className="h-3.5 w-3.5" />}
                        label="TextB (**)"
                    />
                    <ToolbarButton
                        onClick={() => wrapSelection("_")}
                        icon={<TextItalic weight="duotone" className="h-3.5 w-3.5" />}
                        label="TextItalic (_)"
                    />
                    <ToolbarButton
                        onClick={() => wrapSelection("~~")}
                        icon={<TextStrikethrough weight="duotone" className="h-3.5 w-3.5" />}
                        label="TextStrikethrough (~~)"
                    />
                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
                    <ToolbarButton
                        onClick={wrapInlineCode}
                        icon={<Code weight="duotone" className="h-3.5 w-3.5" />}
                        label="Inline Code (`)"
                    />
                    <ToolbarButton
                        onClick={wrapCodeBlock}
                        icon={<Terminal weight="duotone" className="h-3.5 w-3.5" />}
                        label="Code Block (```)"
                    />
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function ToolbarButton({
    onClick,
    icon,
    label,
}: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
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
