"use client";

import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createPostAction } from "../../../posts.action";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface QuoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    targetPost: PostWithUserDTO;
    currentUser: {
        id: string;
        username: string;
        avatar: string;
    };
    onQuoteCreated: (quote: any) => void;
}

export function QuoteDialog({ isOpen, onClose, targetPost, currentUser, onQuoteCreated }: QuoteDialogProps) {
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!content.trim() || isSending) return;

        setIsSending(true);
        try {
            // A quote post is a post with content and repostOfId
            const response = await createPostAction(currentUser.id, content, undefined, undefined, targetPost.id);
            if (response.status === "success" && response.data) {
                onQuoteCreated(response.data);
                setContent("");
                toast.success("Quote posted");
                onClose();
            } else {
                toast.error(response.error?.message || "Failed to post quote");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-white/10 p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-white/5">
                    <DialogTitle className="text-white text-center">Quote</DialogTitle>
                </DialogHeader>

                <div className="p-6 flex flex-col gap-4">
                    {/* User Input */}
                    <div className="flex gap-4">
                        <UserAvatar src={currentUser.avatar} className="h-10 w-10 shrink-0" />
                        <div className="flex-1 flex flex-col gap-3">
                            <MentionTextarea
                                value={content}
                                onChange={setContent}
                                placeholder="Add a comment!"
                                onSubmit={handleSend}
                                className="min-h-[100px] bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-600 p-0 text-lg"
                                autoFocus={true}
                                currentUserId={currentUser.id}
                                draftKey={`quote-${targetPost.id}`}
                            />
                        </div>
                    </div>

                    {/* Quoted Post Box */}
                    <div className="ml-14 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                            <UserAvatar src={targetPost.user.avatar || "/avatars/avatar1.png"} className="h-5 w-5 shrink-0" />
                            <span className="font-bold text-white text-[14px]">{targetPost.user.username}</span>
                            <span className="text-zinc-500 text-sm">·</span>
                            <span className="text-zinc-500 text-sm">
                                {formatDistanceToNow(new Date(targetPost.createdAt), { addSuffix: true, locale: id })}
                            </span>
                        </div>
                        <p className="text-zinc-300 text-[15px] line-clamp-4">{targetPost.content}</p>
                    </div>
                </div>

                <div className="p-4 bg-zinc-900/30 border-t border-white/5 flex justify-end">
                    <Button
                        onClick={handleSend}
                        disabled={!content.trim() || isSending}
                        className="rounded-full bg-white text-black hover:bg-zinc-200 px-6 font-bold"
                    >
                        {isSending ? "Posting..." : "Post"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
