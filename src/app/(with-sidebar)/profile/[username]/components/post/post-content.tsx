"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { PostMedia } from "../post-media";
import { LinkPreviewCard } from "@/app/(with-sidebar)/channels/[roomId]/components/link-preview-card";
import { cn } from "@/lib/utils";
import { PostLinkPreview } from "@/lib/entities/models/post.model";
import { parseFediverseContent } from "@/lib/fediverse-content-parser";
import { getCustomEmojisAction, CustomEmojiDTO } from "@/app/emoji.action";

interface PostContentProps {
    content?: string;
    attachments?: any[];
    onImageClick?: (index: number) => void;
    urls?: string[];
    linkPreviews?: PostLinkPreview[];
    emojis?: { name: string; url: string }[] | null;
    apMetadata?: any;
    isFocused?: boolean;
    isQuote?: boolean;
    className?: string;
}

export function PostContent({
    content,
    attachments,
    onImageClick,
    urls = [],
    linkPreviews = [],
    emojis,
    apMetadata,
    isFocused = false,
    isQuote = false,
    className
}: PostContentProps) {
    const [isCWHidden, setIsCWHidden] = useState(!!apMetadata?.summary);
    const [localCustomEmojis, setLocalCustomEmojis] = useState<CustomEmojiDTO[]>([]);

    useEffect(() => {
        getCustomEmojisAction().then((res) => {
            if (res.status === "success" && res.data) {
                setLocalCustomEmojis(res.data);
            }
        });
    }, []);

    const mergedEmojis = useMemo(() => {
        const localMapped = localCustomEmojis.map(e => ({ name: e.shortcode, url: e.url }));
        return [...(emojis || []), ...localMapped];
    }, [emojis, localCustomEmojis]);

    const summary = apMetadata?.summary;
    
    // Clean content from extra newlines between tags if it's HTML-like
    // This prevents whitespace-pre-wrap from rendering newlines between block elements
    const cleanContent = content ? content.replace(/>\n\s*</g, '><') : content;
    const cleanSummary = summary ? summary.replace(/>\n\s*</g, '><') : summary;

    const parsedContent = cleanContent ? parseFediverseContent(cleanContent, mergedEmojis) : cleanContent;
    const parsedSummary = cleanSummary ? parseFediverseContent(cleanSummary, mergedEmojis) : null;

    return (
        <div className={cn("flex flex-col", className)}>
            {summary && (
                <div className="mb-2 p-3 bg-muted/30 border border-border/50 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4">
                        <div 
                            className="text-sm font-medium text-foreground flex-1 break-words"
                            dangerouslySetInnerHTML={{ __html: parsedSummary || "" }}
                        />
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsCWHidden(!isCWHidden); }}
                            className="px-3 py-1 text-xs font-bold bg-muted hover:bg-muted/80 rounded-full transition-colors shrink-0"
                        >
                            {isCWHidden ? "Tampilkan" : "Sembunyikan"}
                        </button>
                    </div>
                </div>
            )}

            {!isCWHidden && parsedContent && (
                <div className={cn(
                    "text-foreground leading-normal whitespace-pre-wrap break-words fediverse-content select-text",
                    isFocused ? "text-[19px] md:text-[21px] mb-3" : isQuote ? "text-[14px] line-clamp-3 mb-1" : "text-[15px] md:text-[16px] mb-2"
                )}>
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]} 
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            a: ({ node, ...props }) => {
                                // Detect if it's a Fediverse hashtag or mention
                                const isHashtag = props.className?.includes("hashtag");
                                const isMention = props.className?.includes("mention");
                                
                                // Check if it's a mailto link (Fediverse handle) and rewrite to profile route
                                let href = props.href;
                                let isInternal = false;
                                
                                if (href?.startsWith("mailto:")) {
                                    const handle = href.replace("mailto:", "");
                                    href = `/profile/${handle}`;
                                    isInternal = true;
                                } else if (href?.startsWith("/") || (typeof window !== 'undefined' && href?.startsWith(window.location.origin))) {
                                    isInternal = true;
                                }

                                return (
                                    <a 
                                        {...props} 
                                        href={href}
                                        className={cn(
                                            "text-primary hover:underline",
                                            (isHashtag || isMention) && "font-medium"
                                        )} 
                                        target={isInternal ? undefined : "_blank"} 
                                        rel={isInternal ? undefined : "noopener noreferrer"} 
                                        onClick={(e) => {
                                            if (isInternal) {
                                                e.stopPropagation();
                                            } else {
                                                e.stopPropagation();
                                            }
                                        }}
                                    />
                                );
                            },
                            p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                            strong: ({ node, ...props }) => <strong {...props} className="font-bold text-foreground" />,
                            em: ({ node, ...props }) => <em {...props} className="italic" />,
                            code: ({ node, ...props }) => <code className="bg-muted px-1.5 py-0.5 rounded text-[0.9em] font-mono" {...props} />,
                            // Ensure spans (often used inside hashtags in Fediverse) render correctly
                            span: ({ node, ...props }) => <span {...props} />,
                            // Ensure fediverse-emoji class is allowed
                            img: ({ node, ...props }) => (
                                <img 
                                    {...props} 
                                    className={cn(
                                        props.className,
                                        props.className?.includes('fediverse-emoji') && "inline-block h-[1.4em] w-[1.4em] align-text-bottom mx-0.5"
                                    )} 
                                />
                            )
                        }}
                    >
                        {parsedContent}
                    </ReactMarkdown>
                </div>
            )}
            
            <PostMedia 
                attachments={attachments || []} 
                onImageClick={onImageClick} 
            />

            {urls.length > 0 && (
                <div className="mt-3">
                    <div key={urls[0]} onClick={(e) => e.stopPropagation()}>
                        <LinkPreviewCard 
                            url={urls[0]} 
                            preview={linkPreviews?.find(lp => lp.url === urls[0])} 
                        />
                    </div>
                    {urls.length > 1 && (
                        <p className="text-[11px] text-muted-foreground ml-1 mt-2 opacity-60 italic">
                            +{urls.length - 1} tautan lainnya dalam konten
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
