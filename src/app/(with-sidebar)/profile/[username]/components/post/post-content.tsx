"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { PostMedia } from "../post-media";
import { LinkPreviewCard } from "@/app/(with-sidebar)/channels/[roomId]/components/link-preview-card";
import { cn } from "@/lib/utils";
import { PostLinkPreview } from "@/lib/entities/models/post.model";
import { parseFediverseContent } from "@/lib/fediverse-content-parser";

interface PostContentProps {
    content?: string;
    attachments?: any[];
    onImageClick?: (index: number) => void;
    urls?: string[];
    linkPreviews?: PostLinkPreview[];
    emojis?: { name: string; url: string }[] | null;
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
    isFocused = false,
    isQuote = false,
    className
}: PostContentProps) {
    const parsedContent = content ? parseFediverseContent(content, emojis) : content;

    return (
        <div className={cn("flex flex-col", className)}>
            {parsedContent && (
                <div className={cn(
                    "text-foreground leading-normal whitespace-pre-wrap break-words fediverse-content",
                    isFocused ? "text-[19px] md:text-[21px] mb-3" : isQuote ? "text-[14px] line-clamp-3 mb-1" : "text-[15px] md:text-[16px] mb-2"
                )}>
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} 
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
                                } else if (href?.startsWith("/") || href?.startsWith(window.location.origin)) {
                                    isInternal = true;
                                }

                                return (
                                    <a 
                                        {...props} 
                                        href={href}
                                        className={cn(
                                            "text-sky-500 hover:underline",
                                            (isHashtag || isMention) && "font-medium"
                                        )} 
                                        target={isInternal ? undefined : "_blank"} 
                                        rel={isInternal ? undefined : "noopener noreferrer"} 
                                        onClick={(e) => {
                                            if (isInternal) {
                                                e.stopPropagation();
                                                // If it's internal, let next/link handle it if possible, 
                                                // but since we are in ReactMarkdown's raw anchor, 
                                                // standard href navigation is fine.
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
                                        props.className?.includes('fediverse-emoji') && "inline-block h-[1.2em] w-[1.2em] align-text-bottom mx-0.5"
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
                <div className="mt-3 space-y-2">
                    {urls.map((url) => (
                        <div key={url} onClick={(e) => e.stopPropagation()}>
                            <LinkPreviewCard 
                                url={url} 
                                preview={linkPreviews?.find(lp => lp.url === url)} 
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
