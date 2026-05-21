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

interface ReplyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    parentPost: PostWithUserDTO;
    currentUser: {
        id: string;
        username: string;
        avatar: string;
    };
    onReplyCreated: (reply: any) => void;
}

export function ReplyDialog({ isOpen, onClose, parentPost, currentUser, onReplyCreated }: ReplyDialogProps) {
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!content.trim() || isSending) return;

        setIsSending(true);
        try {
            const response = await createPostAction(currentUser.id, content, undefined, parentPost.id);
            if (response.status === "success" && response.data) {
                onReplyCreated(response.data);
                setContent("");
                toast.success("Balasan terkirim");
                onClose();
            } else {
                toast.error(response.error?.message || "Gagal mengirim balasan");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-white/10 p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-white/5">
                    <DialogTitle className="text-white text-center">Reply</DialogTitle>
                </DialogHeader>

                <div className="p-6 flex flex-col gap-4">
                    {/* Parent Post Context */}
                    <div className="flex gap-4 relative">
                        <div className="absolute left-5 top-10 bottom-0 w-[2px] bg-zinc-800" />
                        <UserAvatar src={parentPost.user.avatar || "/avatars/avatar1.png"} className="h-10 w-10 shrink-0 z-10" />
                        <div className="flex-1 flex flex-col gap-1 min-w-0 pb-6">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-white truncate">{parentPost.user.username}</span>
                                <span className="text-zinc-500 text-sm">·</span>
                                <span className="text-zinc-500 text-sm whitespace-nowrap">
                                    {formatDistanceToNow(new Date(parentPost.createdAt), { addSuffix: true, locale: id })}
                                </span>
                            </div>
                            <p className="text-zinc-300 text-[15px] line-clamp-3">{parentPost.content}</p>
                            <div className="text-zinc-500 text-sm mt-2">
                                Replying to <span className="text-primary">@{parentPost.user.username}</span>
                            </div>
                        </div>
                    </div>

                    {/* Reply Input */}
                    <div className="flex gap-4">
                        <UserAvatar src={currentUser.avatar} className="h-10 w-10 shrink-0" />
                        <div className="flex-1 flex flex-col gap-3">
                            <MentionTextarea
                                value={content}
                                onChange={setContent}
                                placeholder="Post your reply"
                                onSubmit={handleSend}
                                className="min-h-[120px] bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-600 p-0 text-lg"
                                autoFocus={true}
                                currentUserId={currentUser.id}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-zinc-900/30 border-t border-white/5 flex justify-end">
                    <Button
                        onClick={handleSend}
                        disabled={!content.trim() || isSending}
                        className="rounded-full bg-white text-black hover:bg-zinc-200 px-6 font-bold"
                    >
                        {isSending ? "Sending..." : "Reply"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
