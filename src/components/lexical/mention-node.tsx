"use client";

import React from "react";

import {
    DecoratorNode,
    DOMExportOutput,
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from "lexical";

export type SerializedMentionNode = Spread<
    {
        mentionId: string;
        mentionName: string;
    },
    SerializedLexicalNode
>;

export class MentionNode extends DecoratorNode<React.JSX.Element> {
    __mentionId: string;
    __mentionName: string;

    static getType(): string {
        return "mention";
    }

    static clone(node: MentionNode): MentionNode {
        return new MentionNode(node.__mentionId, node.__mentionName, node.__key);
    }

    constructor(mentionId: string, mentionName: string, key?: NodeKey) {
        super(key);
        this.__mentionId = mentionId;
        this.__mentionName = mentionName;
    }

    // Container span — NO styling here. decorate() handles all visuals.
    createDOM(_config: EditorConfig): HTMLElement {
        const span = document.createElement("span");
        span.setAttribute("data-mention-id", this.__mentionId);
        span.setAttribute("data-lexical-mention", "true");
        return span;
    }

    updateDOM(): false {
        return false;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement("span");
        element.setAttribute("data-mention-id", this.__mentionId);
        element.textContent = `@${this.__mentionName}`;
        return { element };
    }

    static importJSON(serializedNode: SerializedMentionNode): MentionNode {
        return $createMentionNode(
            serializedNode.mentionId,
            serializedNode.mentionName
        );
    }

    exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            type: "mention",
            mentionId: this.__mentionId,
            mentionName: this.__mentionName,
            version: 1,
        };
    }

    getTextContent(): string {
        return `@${this.__mentionName}`;
    }

    // All visual rendering happens here — single styled span
    decorate(): React.JSX.Element {
        return (
            <span className="text-primary bg-primary/15 px-1 pb-0.5 pt-[1px] rounded-[4px] font-bold cursor-default select-none inline-block">
                @{this.__mentionName}
            </span>
        );
    }

    isInline(): boolean {
        return true;
    }

    // Atomic: cannot type into the mention
    canInsertTextBefore(): boolean {
        return false;
    }

    canInsertTextAfter(): boolean {
        return false;
    }

    // NOT isolated — allows proper backspace/delete behavior
    isIsolated(): boolean {
        return false;
    }
}

export function $createMentionNode(
    mentionId: string,
    mentionName: string
): MentionNode {
    return new MentionNode(mentionId, mentionName);
}

export function $isMentionNode(
    node: LexicalNode | null | undefined
): node is MentionNode {
    return node instanceof MentionNode;
}
