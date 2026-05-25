"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { createPostAction } from "@/app/posts.action";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface SimpleReplyInputProps {
    currentUser: {
        id: string;
        username: string;
        avatar: string;
    };
    postId: string;
    onReplyCreated: (reply: any) => void;
}

export function SimpleReplyInput({ currentUser, postId, onReplyCreated }: SimpleReplyInputProps) {
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!content.trim() || isSending) return;

        setIsSending(true);
        try {
            const response = await createPostAction(currentUser.id, content, undefined, postId);
            if (response.status === "success" && response.data) {
                onReplyCreated(response.data);
                setContent("");
                toast.success("Balasan terkirim");
            } else {
                toast.error(response.error?.message || "Gagal membalas");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
            <UserAvatar src={currentUser.avatar} className="h-9 w-9 shrink-0" />
            <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Post your reply"
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-[15px] placeholder:text-zinc-600"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            />
            <Button
                onClick={handleSend}
                disabled={!content.trim() || isSending}
                className="rounded-full bg-white text-black hover:bg-zinc-200 font-bold px-5 h-9 text-sm"
            >
                {isSending ? "..." : "Reply"}
            </Button>
        </div>
    );
}
