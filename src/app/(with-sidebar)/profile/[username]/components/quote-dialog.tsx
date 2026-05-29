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
import { useState, useRef } from "react";
import { ImagePlus, X, FileIcon, Loader2 } from "lucide-react";
import { PostMedia } from "./post-media";
import { createPostAction } from "@/app/posts.action";
import { uploadFileAction } from "@/app/(with-sidebar)/channels/[roomId]/messages.action";
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
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<{ file: File; preview: string | null }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILES = 4;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const generatePreview = (file: File): Promise<string | null> => {
        return new Promise((resolve) => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            } else if (file.type.startsWith("video/")) {
                resolve(URL.createObjectURL(file));
            } else {
                resolve(null);
            }
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (selectedFiles.length + files.length > MAX_FILES) {
            toast.error(`Maksimal ${MAX_FILES} file media`);
            return;
        }

        const validFiles: File[] = [];
        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`File "${file.name}" terlalu besar (Max 10MB)`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        const newPreviews = await Promise.all(
            validFiles.map(async (file) => ({
                file,
                preview: await generatePreview(file),
            }))
        );

        setSelectedFiles((prev) => [...prev, ...validFiles]);
        setFilePreviews((prev) => [...prev, ...newPreviews]);

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if ((!content.trim() && selectedFiles.length === 0) || isSending) return;

        setIsSending(true);
        try {
            let attachments: any[] | undefined = undefined;

            if (selectedFiles.length > 0) {
                const uploadPromises = selectedFiles.map(async (file) => {
                    const formData = new FormData();
                    formData.append("file", file);
                    const res = await uploadFileAction(formData, "posts");
                    if (res.status === "success" && res.data) {
                        return {
                            url: res.data.fileurl,
                            key: res.data.filename,
                            fileType: res.data.mimetype,
                        };
                    }
                    throw new Error("Gagal mengunggah media");
                });
                attachments = await Promise.all(uploadPromises);
            }

            const response = await createPostAction(currentUser.id, content, attachments, undefined, targetPost.id);
            if (response.status === "success" && response.data) {
                onQuoteCreated(response.data);
                setContent("");
                setSelectedFiles([]);
                setFilePreviews([]);
                localStorage.removeItem(`draft_quote-${targetPost.id}`);
                toast.success("Quote posted");
                onClose();
            } else {
                toast.error(response.error?.message || "Failed to post quote");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
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
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileSelect}
                            />
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

                            {/* Self Previews */}
                            {filePreviews.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {filePreviews.map((item, index) => (
                                        <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                                            {item.preview ? (
                                                item.file.type.startsWith("video/") ? (
                                                    <video src={item.preview} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={item.preview} className="w-full h-full object-cover" alt="preview" />
                                                )
                                            ) : (
                                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                                    <FileIcon className="h-8 w-8 text-zinc-500" />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => removeFile(index)}
                                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 p-1.5 rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quoted Post Box */}
                    <div className="ml-14 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 bg-white/[0.02] overflow-hidden">
                        <div className="flex items-start gap-2">
                            <UserAvatar src={targetPost.user?.avatar || targetPost.remoteActor?.avatar || "/avatars/avatar1.png"} className="h-5 w-5 shrink-0" />
                            <div className="flex items-baseline gap-1.5 min-w-0 leading-tight">
                                <span className="font-bold text-white text-[14px] line-clamp-1">{targetPost.user?.username || targetPost.remoteActor?.username || "unknown"}</span>
                                {targetPost.remoteActor && <span className="text-[12px] text-zinc-500 line-clamp-1">@{targetPost.remoteActor.username}@{targetPost.remoteActor.domain}</span>}
                            </div>
                            <div className="flex items-center gap-1 text-zinc-500 text-xs ml-auto">
                                <span>{formatDistanceToNow(new Date(targetPost.createdAt), { addSuffix: true, locale: id })}</span>
                            </div>
                        </div>
                        {targetPost.content && <p className="text-zinc-300 text-[15px] line-clamp-4 leading-normal mt-1">{targetPost.content}</p>}
                        <PostMedia attachments={targetPost.attachments || []} isQuoted />
                    </div>
                </div>

                <div className="p-4 bg-zinc-900/30 border-t border-white/5 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-sky-500 rounded-full hover:bg-sky-500/10"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImagePlus className="h-5 w-5" />
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={(!content.trim() && selectedFiles.length === 0) || isSending}
                        className="rounded-full bg-white text-black hover:bg-zinc-200 px-6 font-bold"
                    >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
