"use client";

import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    TextNode,
    $getRoot,
    $isParagraphNode,
    LexicalNode,
    $isElementNode,
    LexicalEditor
} from "lexical";

const DIM_STYLE = "opacity: 0.35;";
const CODE_FENCE_STYLE =
    "opacity: 0.4; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #888888;";
const CODE_BLOCK_LINE_STYLE =
    "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12.5px; line-height: 1.6;";

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_CODE = 16;

const STYLE_NONE = 0;
const STYLE_DIM = 1;
const STYLE_CODE_FENCE = 2;
const STYLE_CODE_LINE = 3;

interface MdPattern {
    regex: RegExp;
    symLen: number;
    format: number;
    isBlockCode?: boolean;
}

const PATTERNS: MdPattern[] = [
    { regex: /```[\s\S]*?```/g, symLen: 3, format: 0, isBlockCode: true },
    { regex: /\*\*\*(?!\s)[\s\S]+?(?<!\s)\*\*\*/g, symLen: 3, format: FORMAT_BOLD | FORMAT_ITALIC },
    { regex: /___(?!\s)[\s\S]+?(?<!\s)___/g, symLen: 3, format: FORMAT_BOLD | FORMAT_ITALIC },
    { regex: /\*\*(?!\s)[\s\S]+?(?<!\s)\*\*/g, symLen: 2, format: FORMAT_BOLD },
    { regex: /__(?!\s)[\s\S]+?(?<!\s)__/g, symLen: 2, format: FORMAT_BOLD },
    { regex: /\*(?!\s)[\s\S]+?(?<!\s)\*/g, symLen: 1, format: FORMAT_ITALIC },
    { regex: /_(?!\s)[\s\S]+?(?<!\s)_/g, symLen: 1, format: FORMAT_ITALIC },
    { regex: /~~(?!\s)[\s\S]+?(?<!\s)~~/g, symLen: 2, format: FORMAT_STRIKETHROUGH },
    { regex: /(?<!`)`([^`]+)`(?!`)/g, symLen: 1, format: FORMAT_CODE },
];

export function MarkdownDecoratorPlugin() {
    const [editor] = useLexicalComposerContext();
    const isProcessingRef = useRef(false);

    useEffect(() => {
        const removeListener = editor.registerUpdateListener(({ editorState, prevEditorState }) => {
            if (editorState === prevEditorState) return;
            if (isProcessingRef.current) return;

            setTimeout(() => {
                editor.update(
                    () => {
                        if (isProcessingRef.current) return;
                        isProcessingRef.current = true;
                        try {
                            applyGlobalMarkdownLexer();
                        } finally {
                            isProcessingRef.current = false;
                        }
                    },
                    { discrete: true }
                );
            }, 0);
        });

        return () => removeListener();
    }, [editor]);

    return null;
}

function applyGlobalMarkdownLexer() {
    const root = $getRoot();
    let globalText = "";
    const textNodes: { node: TextNode; start: number; end: number }[] = [];

    function traverseBuild(node: LexicalNode) {
        if ($isElementNode(node)) {
            const children = node.getChildren();
            const isPara = $isParagraphNode(node);
            const isRoot = node === root;

            for (let i = 0; i < children.length; i++) {
                if (isRoot && i > 0) globalText += "\n";
                traverseBuild(children[i]);
            }
        } else if (node instanceof TextNode) {
            const text = node.getTextContent();
            if (text.length > 0) {
                textNodes.push({ node, start: globalText.length, end: globalText.length + text.length });
                globalText += text;
            }
        } else {
            // MentionNode etc
            globalText += node.getTextContent();
        }
    }

    traverseBuild(root);

    const len = globalText.length;
    if (len === 0) return;

    const formats = new Uint8Array(len);
    const styles = new Uint8Array(len);
    const isToken = new Uint8Array(len);

    for (const pattern of PATTERNS) {
        pattern.regex.lastIndex = 0;
        let match;
        while ((match = pattern.regex.exec(globalText)) !== null) {
            const start = match.index;
            const symLen = pattern.symLen;
            const matchLen = match[0].length;
            const end = start + matchLen;

            // Overlap check
            let overlap = false;
            for (let i = start; i < start + symLen; i++) { if (isToken[i]) overlap = true; }
            for (let i = end - symLen; i < end; i++) { if (isToken[i]) overlap = true; }

            if (!pattern.isBlockCode && !overlap) {
                for (let i = start; i < end; i++) {
                    if (styles[i] === STYLE_CODE_LINE || styles[i] === STYLE_CODE_FENCE) {
                        overlap = true;
                        break;
                    }
                }
            }

            if (overlap) {
                pattern.regex.lastIndex = start + 1;
                continue;
            }

            // Mark tokens and content
            if (pattern.isBlockCode) {
                for (let i = start; i < start + symLen; i++) { styles[i] = STYLE_CODE_FENCE; isToken[i] = 1; }
                for (let i = end - symLen; i < end; i++) { styles[i] = STYLE_CODE_FENCE; isToken[i] = 1; }
                for (let i = start + symLen; i < end - symLen; i++) { styles[i] = STYLE_CODE_LINE; isToken[i] = 0; }
            } else {
                for (let i = start; i < start + symLen; i++) { formats[i] |= pattern.format; styles[i] = STYLE_DIM; isToken[i] = 1; }
                for (let i = end - symLen; i < end; i++) { formats[i] |= pattern.format; styles[i] = STYLE_DIM; isToken[i] = 1; }
                for (let i = start + symLen; i < end - symLen; i++) { formats[i] |= pattern.format; isToken[i] = 0; }
            }
        }
    }

    // Apply to nodes
    for (const { node, start, end } of textNodes) {
        if (!node.isAttached()) continue;
        const localSplits: number[] = [];
        let currFormat = formats[start];
        let currStyle = styles[start];
        let currToken = isToken[start];

        for (let i = 1; i < (end - start); i++) {
            const gIdx = start + i;
            if (formats[gIdx] !== currFormat || styles[gIdx] !== currStyle || isToken[gIdx] !== currToken) {
                localSplits.push(i);
                currFormat = formats[gIdx];
                currStyle = styles[gIdx];
                currToken = isToken[gIdx];
            }
        }

        if (localSplits.length > 0) {
            const parts = node.splitText(...localSplits);
            let pStart = start;
            for (const part of parts) {
                const pLen = part.getTextContent().length;
                applyStyles(part, formats[pStart], styles[pStart], isToken[pStart]);
                pStart += pLen;
            }
        } else {
            applyStyles(node, formats[start], styles[start], isToken[start]);
        }
    }
}

function applyStyles(node: TextNode, format: number, styleInt: number, isToken: number) {
    let css = "";
    if (styleInt === STYLE_DIM) css = DIM_STYLE;
    else if (styleInt === STYLE_CODE_FENCE) css = CODE_FENCE_STYLE;
    else if (styleInt === STYLE_CODE_LINE) css = CODE_BLOCK_LINE_STYLE;

    const targetMode = isToken ? "token" : "normal";

    if (node.getFormat() !== format) node.setFormat(format);
    if (node.getStyle() !== css) node.setStyle(css);
    if (node.getMode() !== targetMode) node.setMode(targetMode);
}
