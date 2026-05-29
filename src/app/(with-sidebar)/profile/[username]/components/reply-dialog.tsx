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
import { useState, useRef, useMemo } from "react";
import { ImagePlus, X, FileIcon, Loader2 } from "lucide-react";
import { PostMedia } from "./post-media";
import { createPostAction } from "@/app/posts.action";
import { uploadFileAction } from "@/app/(with-sidebar)/channels/[roomId]/messages.action";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";

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

            const response = await createPostAction(currentUser.id, content, attachments, parentPost.id);
            if (response.status === "success" && response.data) {
                onReplyCreated(response.data);
                setContent("");
                setSelectedFiles([]);
                setFilePreviews([]);
                localStorage.removeItem(`draft_reply-${parentPost.id}`);
                toast.success("Reply posted");
                onClose();
            } else {
                toast.error(response.error?.message || "Failed to post reply");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        } finally {
            setIsSending(false);
        }
    };

    const parentUserInfo = useMemo(() => {
        const u = parentPost.user || parentPost.remoteActor;
        const isRemote = !!parentPost.remoteActor;
        const username = u?.username || "unknown";
        const handle = isRemote ? `@${username}@${parentPost.remoteActor?.domain}` : `@${username}`;
        return { username, handle, avatar: u?.avatar };
    }, [parentPost]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-white/10 p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-white/5">
                    <DialogTitle className="text-white text-center">Balas</DialogTitle>
                </DialogHeader>

                <div className="p-6 flex flex-col gap-0 max-h-[70vh] overflow-y-auto">
                    {/* Parent Post Preview */}
                    <div className="flex gap-4 relative">
                        <div className="flex flex-col items-center shrink-0">
                            <UserAvatar src={parentUserInfo.avatar || "/avatars/avatar1.png"} className="h-10 w-10 z-10" />
                            <div className="w-0.5 flex-1 bg-zinc-800 my-1" />
                        </div>
                        <div className="flex-1 pb-6">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-bold text-white line-clamp-1">{parentUserInfo.username}</span>
                                <span className="text-zinc-500 text-[12px] line-clamp-1">{parentUserInfo.handle}</span>
                                <span className="text-zinc-500">·</span>
                                <span className="text-zinc-500 text-xs">{formatDistanceToNow(new Date(parentPost.createdAt), { addSuffix: true, locale: id })}</span>
                            </div>
                            <p className="text-zinc-300 text-[15px] line-clamp-4 leading-normal">{parentPost.content}</p>
                            <div className="mt-2 opacity-50 pointer-events-none">
                                <PostMedia attachments={parentPost.attachments || []} isQuoted />
                            </div>
                        </div>
                    </div>

                    {/* User Input */}
                    <div className="flex gap-4 pt-2">
                        <div className="flex flex-col items-center shrink-0">
                            <UserAvatar src={currentUser.avatar} className="h-10 w-10" />
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            <div className="text-[15px] text-zinc-500">
                                Balas ke <span className="text-sky-500">{parentUserInfo.handle}</span>
                            </div>
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
                                placeholder="Posting balasan Anda"
                                onSubmit={handleSend}
                                className="min-h-[100px] bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-600 p-0 text-lg"
                                autoFocus={true}
                                currentUserId={currentUser.id}
                                draftKey={`reply-${parentPost.id}`}
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
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Balas"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
