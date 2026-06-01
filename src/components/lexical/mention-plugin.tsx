"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_LOW,
    KEY_BACKSPACE_COMMAND,
    KEY_DOWN_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
    KEY_TAB_COMMAND,
    KEY_ARROW_UP_COMMAND,
    KEY_ARROW_DOWN_COMMAND,
    TextNode,
    LexicalEditor,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createMentionNode, $isMentionNode } from "./mention-node";
import { cn } from "@/lib/utils";

interface MentionOption {
    id: string;
    username: string;
    avatar: string;
}

interface MentionPluginProps {
    participants: {
        user: {
            id: string;
            username: string;
            avatar: string;
        };
    }[];
    currentUserId: string;
    getMenuContainer?: () => HTMLElement | null;
}

export function MentionPlugin({
    participants,
    currentUserId,
    getMenuContainer,
}: MentionPluginProps) {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const options = useMemo((): MentionOption[] => {
        if (queryString === null) return [];
        const query = queryString.toLowerCase();

        const everyoneOption: MentionOption = {
            id: "everyone",
            username: "everyone",
            avatar: "",
        };

        const users: MentionOption[] = participants
            .map((p) => ({
                id: p.user.id,
                username: p.user.username,
                avatar: p.user.avatar || "/avatars/avatar1.png",
            }))
            .filter(
                (u) =>
                    u.username.toLowerCase().startsWith(query) && u.id !== currentUserId
            );

        const result = "everyone".startsWith(query)
            ? [everyoneOption, ...users]
            : users;
        return result.slice(0, 10);
    }, [queryString, participants, currentUserId]);

    const insertMention = useCallback(
        (option: MentionOption) => {
            editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                const anchor = selection.anchor;
                const anchorNode = anchor.getNode();

                if (!$isTextNode(anchorNode)) return;

                const textContent = anchorNode.getTextContent();
                const anchorOffset = anchor.offset;

                // Find the @ symbol position
                const textBeforeCursor = textContent.slice(0, anchorOffset);
                const atIndex = textBeforeCursor.lastIndexOf("@");
                if (atIndex === -1) return;

                // Split the text node: before @, mention node, after cursor
                const beforeText = textContent.slice(0, atIndex);
                const afterText = textContent.slice(anchorOffset);

                const mentionNode = $createMentionNode(option.id, option.username);
                const spaceNode = new TextNode(" ");

                if (beforeText) {
                    anchorNode.setTextContent(beforeText);
                    anchorNode.insertAfter(mentionNode);
                    mentionNode.insertAfter(spaceNode);
                } else {
                    anchorNode.replace(mentionNode);
                    mentionNode.insertAfter(spaceNode);
                    if (afterText) {
                        const afterNode = new TextNode(afterText);
                        spaceNode.insertAfter(afterNode);
                    }
                }

                // Move selection after the space
                spaceNode.selectEnd();
            });

            setQueryString(null);
            setMenuPosition(null);
        },
        [editor]
    );

    // Listen for text changes to detect @ trigger
    useEffect(() => {
        const removeListener = editor.registerTextContentListener(() => {
            editor.getEditorState().read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
                    setQueryString(null);
                    setMenuPosition(null);
                    return;
                }

                const anchor = selection.anchor;
                const anchorNode = anchor.getNode();
                if (!$isTextNode(anchorNode)) {
                    setQueryString(null);
                    setMenuPosition(null);
                    return;
                }

                const textContent = anchorNode.getTextContent();
                const textBeforeCursor = textContent.slice(0, anchor.offset);
                const match = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);

                if (match) {
                    setQueryString(match[1]);
                    setSelectedIndex(0);

                    // Get cursor position for menu placement
                    const domSelection = window.getSelection();
                    if (domSelection && domSelection.rangeCount > 0) {
                        const range = domSelection.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        setMenuPosition({ top: rect.top, left: rect.left });
                    }
                } else {
                    setQueryString(null);
                    setMenuPosition(null);
                }
            });
        });
        return removeListener;
    }, [editor]);

    // Handle keyboard navigation in the mention menu
    useEffect(() => {
        if (queryString === null || options.length === 0) return;

        const removeArrowUp = editor.registerCommand(
            KEY_ARROW_UP_COMMAND,
            (e) => {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(0, prev - 1));
                return true;
            },
            COMMAND_PRIORITY_LOW
        );

        const removeArrowDown = editor.registerCommand(
            KEY_ARROW_DOWN_COMMAND,
            (e) => {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(options.length - 1, prev + 1));
                return true;
            },
            COMMAND_PRIORITY_LOW
        );

        const removeEnter = editor.registerCommand(
            KEY_ENTER_COMMAND,
            (e) => {
                if (options.length > 0) {
                    e?.preventDefault();
                    insertMention(options[selectedIndex]);
                    return true;
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );

        const removeTab = editor.registerCommand(
            KEY_TAB_COMMAND,
            (e) => {
                if (options.length > 0) {
                    e.preventDefault();
                    insertMention(options[selectedIndex]);
                    return true;
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );

        const removeEscape = editor.registerCommand(
            KEY_ESCAPE_COMMAND,
            (e) => {
                e.preventDefault();
                setQueryString(null);
                setMenuPosition(null);
                return true;
            },
            COMMAND_PRIORITY_LOW
        );

        return () => {
            removeArrowUp();
            removeArrowDown();
            removeEnter();
            removeTab();
            removeEscape();
        };
    }, [editor, queryString, options, selectedIndex, insertMention]);

    if (queryString === null || options.length === 0 || !menuPosition)
        return null;

    return (
        <div
            ref={menuRef}
            className="absolute bottom-[calc(100%+8px)] left-0 w-56 sm:w-64 bg-background/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.1)] border border-border/50 rounded-xl overflow-hidden z-[60] flex flex-col py-1"
        >
            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground tracking-widest border-b border-border/40">
                Pilih Anggota
            </div>
            <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin">
                {options.map((opt, idx) => (
                    <button
                        key={opt.id}
                        onClick={() => insertMention(opt)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                            "flex items-center gap-3 w-full px-2 py-2 text-sm text-left transition-colors rounded-lg select-none",
                            idx === selectedIndex
                                ? "bg-primary/10 text-primary font-semibold"
                                : "hover:bg-muted font-medium text-foreground/90"
                        )}
                    >
                        {opt.id === "everyone" ? (
                            <div className="w-5 h-5 flex-shrink-0 rounded-md bg-primary/20 flex items-center justify-center">
                                <span className="text-primary text-xs font-black">@</span>
                            </div>
                        ) : (
                            <img
                                src={opt.avatar}
                                alt={opt.username}
                                className="w-5 h-5 rounded-md object-cover flex-shrink-0"
                            />
                        )}
                        <span className="truncate">{opt.username}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
