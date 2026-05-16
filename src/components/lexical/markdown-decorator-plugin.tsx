"use client";

import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    TextNode,
    $getRoot,
    $isParagraphNode,
} from "lexical";

/**
 * MarkdownDecoratorPlugin
 *
 * Preserves markdown symbols and applies visual decoration:
 * - Inline (single paragraph): **bold**, _italic_, ~~strike~~, `code`
 * - Cross-paragraph: **bold\nacross\nlines** — dims symbols, formats all lines
 * - Code blocks: ``` fences → very dim, lines between → monospace
 */

const DIM_STYLE = "opacity: 0.35;";
const CODE_FENCE_STYLE =
    "opacity: 0.25; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #6a737d;";
const CODE_BLOCK_LINE_STYLE =
    "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12.5px; line-height: 1.6; color: #1D1C1D;";

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_CODE = 16;

interface MdPattern {
    regex: RegExp;
    symbolLen: number;
    format: number;
    formatSymbol: boolean;
}

const INLINE_PATTERNS: MdPattern[] = [
    { regex: /\*\*\*(.+?)\*\*\*/g, symbolLen: 3, format: FORMAT_BOLD | FORMAT_ITALIC, formatSymbol: true },
    { regex: /\*\*(.+?)\*\*/g, symbolLen: 2, format: FORMAT_BOLD, formatSymbol: true },
    { regex: /~~(.+?)~~/g, symbolLen: 2, format: FORMAT_STRIKETHROUGH, formatSymbol: true },
    { regex: /_(.+?)_/g, symbolLen: 1, format: FORMAT_ITALIC, formatSymbol: true },
    { regex: /\*(.+?)\*/g, symbolLen: 1, format: FORMAT_ITALIC, formatSymbol: true },
    { regex: /`([^`\n]+)`/g, symbolLen: 1, format: FORMAT_CODE, formatSymbol: false },
];

// Cross-paragraph symbols — ordered longest first
const CROSS_SYMBOLS = [
    { sym: "***", format: FORMAT_BOLD | FORMAT_ITALIC },
    { sym: "**", format: FORMAT_BOLD },
    { sym: "~~", format: FORMAT_STRIKETHROUGH },
    { sym: "_", format: FORMAT_ITALIC },
    { sym: "*", format: FORMAT_ITALIC },
];

export function MarkdownDecoratorPlugin() {
    const [editor] = useLexicalComposerContext();
    const isProcessingRef = useRef(false);

    useEffect(() => {
        // =============================================
        // 1. INLINE markdown (single-line, same node)
        // =============================================
        const removeInlineTransform = editor.registerNodeTransform(
            TextNode,
            (node) => {
                if (isProcessingRef.current) return;
                const text = node.getTextContent();
                if (node.getStyle().includes("opacity")) return;
                if (node.getStyle().includes("font-family")) return;
                if (node.getFormat() !== 0) return;
                if (text.length < 3) return;

                for (const pattern of INLINE_PATTERNS) {
                    pattern.regex.lastIndex = 0;
                    const match = pattern.regex.exec(text);

                    if (match && match[1].length > 0) {
                        const matchStart = match.index;
                        const matchEnd = matchStart + match[0].length;
                        const { symbolLen, format, formatSymbol } = pattern;

                        const rawSplits = [
                            matchStart,
                            matchStart + symbolLen,
                            matchEnd - symbolLen,
                            matchEnd,
                        ];
                        const splits = [...new Set(rawSplits)]
                            .filter((p) => p > 0 && p < text.length)
                            .sort((a, b) => a - b);

                        if (splits.length === 0) continue;

                        const parts = node.splitText(...splits);
                        const boundaries = [0, ...splits, text.length];

                        for (let i = 0; i < parts.length; i++) {
                            const segStart = boundaries[i];
                            const segEnd = boundaries[i + 1];

                            const isOpenSymbol =
                                segStart === matchStart && segEnd === matchStart + symbolLen;
                            const isCloseSymbol =
                                segStart === matchEnd - symbolLen && segEnd === matchEnd;
                            const isContent =
                                segStart === matchStart + symbolLen &&
                                segEnd === matchEnd - symbolLen;

                            if (isOpenSymbol || isCloseSymbol) {
                                parts[i].setStyle(DIM_STYLE);
                                if (formatSymbol) parts[i].setFormat(format);
                                parts[i].setMode("token");
                            } else if (isContent) {
                                parts[i].setFormat(format);
                            }
                        }
                        break;
                    }
                }
            }
        );

        // =============================================
        // 2. CROSS-PARAGRAPH markdown + code blocks
        // =============================================
        const removeBlockListener = editor.registerUpdateListener(
            ({ editorState, prevEditorState }) => {
                if (editorState === prevEditorState) return;
                if (isProcessingRef.current) return;

                // Delay to let inline transforms finish first
                setTimeout(() => {
                    editor.update(
                        () => {
                            isProcessingRef.current = true;
                            try {
                                const root = $getRoot();
                                const paragraphs = root.getChildren().filter($isParagraphNode);

                                decorateCodeBlocks(paragraphs);
                                decorateCrossParagraphFormatting(paragraphs);
                            } finally {
                                isProcessingRef.current = false;
                            }
                        },
                        { discrete: true }
                    );
                }, 0);
            }
        );

        return () => {
            removeInlineTransform();
            removeBlockListener();
        };
    }, [editor]);

    return null;
}

// ===== CODE BLOCKS =====
function decorateCodeBlocks(paragraphs: ReturnType<typeof $getRoot.prototype.getChildren>) {
    let insideCodeBlock = false;

    for (const para of paragraphs) {
        if (!$isParagraphNode(para)) continue;
        const children = para.getChildren();

        // Check if this paragraph is a fence line (sole text child starting with ```)
        if (children.length === 1 && children[0] instanceof TextNode) {
            const child = children[0] as TextNode;
            const text = child.getTextContent().trim();

            if (text.startsWith("```")) {
                if (!insideCodeBlock) {
                    insideCodeBlock = true;
                } else {
                    insideCodeBlock = false;
                }
                if (!child.getStyle().includes("opacity")) {
                    child.setStyle(CODE_FENCE_STYLE);
                    child.setMode("token");
                }
                continue;
            }
        }

        // Style content inside code block
        if (insideCodeBlock) {
            for (const child of children) {
                if (child instanceof TextNode && !child.getStyle().includes("font-family")) {
                    child.setStyle(CODE_BLOCK_LINE_STYLE);
                }
            }
        }
    }
}

// ===== CROSS-PARAGRAPH BOLD/ITALIC/STRIKETHROUGH =====
function decorateCrossParagraphFormatting(paragraphs: ReturnType<typeof $getRoot.prototype.getChildren>) {
    // For each cross-paragraph symbol, scan for opening + closing across paragraphs
    for (const { sym, format } of CROSS_SYMBOLS) {
        let openParaIdx = -1;
        let openNode: TextNode | null = null;

        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            if (!$isParagraphNode(para)) continue;
            const children = para.getChildren();
            if (children.length === 0) continue;

            const firstChild = children[0];
            const lastChild = children[children.length - 1];

            if (openParaIdx === -1) {
                // Look for opening symbol
                if (!(firstChild instanceof TextNode)) continue;
                const text = firstChild.getTextContent();

                // Must start with symbol, not be already decorated, and have content after symbol
                if (
                    text.startsWith(sym) &&
                    firstChild.getFormat() === 0 &&
                    !firstChild.getStyle().includes("opacity") &&
                    text.length > sym.length
                ) {
                    // Prevent shorter symbol matching when longer one applies
                    // e.g., skip * if ** also matches
                    const longerMatches = CROSS_SYMBOLS.some(
                        (cs) => cs.sym.length > sym.length && text.startsWith(cs.sym)
                    );
                    if (longerMatches) continue;

                    // Make sure the closing symbol also exists in a later paragraph
                    // (check ahead before committing)
                    let hasClose = false;
                    for (let j = i + 1; j < paragraphs.length; j++) {
                        const pj = paragraphs[j];
                        if (!$isParagraphNode(pj)) continue;
                        const pjChildren = pj.getChildren();
                        if (pjChildren.length === 0) continue;
                        const pjLast = pjChildren[pjChildren.length - 1];
                        if (
                            pjLast instanceof TextNode &&
                            pjLast.getTextContent().endsWith(sym) &&
                            pjLast.getFormat() === 0 &&
                            !pjLast.getStyle().includes("opacity")
                        ) {
                            hasClose = true;
                            break;
                        }
                    }

                    if (!hasClose) continue;

                    openParaIdx = i;
                    openNode = firstChild as TextNode;
                }
            } else {
                // Look for closing symbol
                if (!(lastChild instanceof TextNode)) continue;
                const text = lastChild.getTextContent();

                if (
                    text.endsWith(sym) &&
                    lastChild.getFormat() === 0 &&
                    !lastChild.getStyle().includes("opacity")
                ) {
                    // Prevent shorter symbol matching when longer one applies
                    const longerMatches = CROSS_SYMBOLS.some(
                        (cs) => cs.sym.length > sym.length && text.endsWith(cs.sym)
                    );
                    if (longerMatches) continue;

                    // === APPLY FORMATTING ===

                    // 1. Opening paragraph: split symbol from content
                    if (openNode) {
                        const openText = openNode.getTextContent();
                        if (openText.length > sym.length) {
                            const parts = openNode.splitText(sym.length);
                            parts[0].setStyle(DIM_STYLE);
                            parts[0].setFormat(format);
                            parts[0].setMode("token");
                            parts[1].setFormat(format);
                        } else {
                            openNode.setStyle(DIM_STYLE);
                            openNode.setFormat(format);
                            openNode.setMode("token");
                        }

                        // Also format remaining children in the opening paragraph
                        const openPara = paragraphs[openParaIdx];
                        if ($isParagraphNode(openPara)) {
                            for (const child of openPara.getChildren()) {
                                if (child instanceof TextNode && child.getFormat() === 0 && !child.getStyle().includes("opacity")) {
                                    child.setFormat(format);
                                }
                            }
                        }
                    }

                    // 2. Middle paragraphs: format all text nodes
                    for (let m = openParaIdx + 1; m < i; m++) {
                        const midPara = paragraphs[m];
                        if (!$isParagraphNode(midPara)) continue;
                        for (const child of midPara.getChildren()) {
                            if (child instanceof TextNode && child.getFormat() === 0) {
                                child.setFormat(format);
                            }
                        }
                    }

                    // 3. Closing paragraph: split content from symbol
                    const closeText = lastChild.getTextContent();
                    if (closeText.length > sym.length) {
                        const splitAt = closeText.length - sym.length;
                        const parts = lastChild.splitText(splitAt);
                        parts[0].setFormat(format);
                        parts[1].setStyle(DIM_STYLE);
                        parts[1].setFormat(format);
                        parts[1].setMode("token");
                    } else {
                        lastChild.setStyle(DIM_STYLE);
                        lastChild.setFormat(format);
                        lastChild.setMode("token");
                    }

                    // Also format any preceding children in the closing paragraph
                    const closePara = paragraphs[i];
                    if ($isParagraphNode(closePara)) {
                        for (const child of closePara.getChildren()) {
                            if (child instanceof TextNode && child.getFormat() === 0 && !child.getStyle().includes("opacity")) {
                                child.setFormat(format);
                            }
                        }
                    }

                    // Reset search for this symbol
                    openParaIdx = -1;
                    openNode = null;
                }
            }
        }
    }
}
