"use client";

import { useState } from "react";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { createPostAction } from "../../../posts.action";
import { toast } from "sonner";
import { SendHorizontal } from "lucide-react";

interface PostInputProps {
    currentUser: {
        id: string;
        username: string;
        avatar: string;
    };
    onPostCreated: (post: any) => void;
}

export function PostInput({ currentUser, onPostCreated }: PostInputProps) {
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!content.trim() || isSending) return;

        setIsSending(true);
        try {
            const response = await createPostAction(currentUser.id, content);
            if (response.status === "success" && response.data) {
                onPostCreated(response.data);
                setContent("");
                toast.success("Kiriman berhasil dibuat");
            } else {
                toast.error(response.error?.message || "Gagal membuat kiriman");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex gap-4 p-6 bg-zinc-900/50 border-b border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
            <UserAvatar src={currentUser.avatar} className="h-10 w-10 shrink-0" />
            <div className="flex-1 flex flex-col gap-3">
                <MentionTextarea
                    value={content}
                    onChange={setContent}
                    placeholder="Apa yang Anda pikirkan?"
                    onSubmit={handleSend}
                    className="min-h-[80px] bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-600 p-0 text-lg"
                    autoFocus={false}
                    currentUserId={currentUser.id}
                />
                <div className="flex justify-end pt-2">
                    <Button
                        onClick={handleSend}
                        disabled={!content.trim() || isSending}
                        className="rounded-full bg-white text-black hover:bg-zinc-200 px-6 font-bold"
                    >
                        {isSending ? "Mengirim..." : "Thread"}
                        {!isSending && <SendHorizontal className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
