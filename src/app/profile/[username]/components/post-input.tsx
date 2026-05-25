"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { createPostAction } from "../../../posts.action";
import { uploadFileAction } from "../../../(with-sidebar)/channels/[roomId]/messages.action";
import { toast } from "sonner";
import { SendHorizontal, ImagePlus, X, FileIcon, Loader2 } from "lucide-react";
import { optimisticPostRepository } from "@/lib/infrastructure/optimistic-post.repository";
import { createId } from "@paralleldrive/cuid2";
import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { cn } from "@/lib/utils";

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
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<{ file: File; preview: string | null }[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const CHAR_LIMIT = 280;
    const MAX_FILES = 4;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // Click outside to collapse
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (content.trim() === "" && selectedFiles.length === 0) {
                    setIsExpanded(false);
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [content, selectedFiles]);

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
            toast.error(`Maksimal ${MAX_FILES} file media per postingan`);
            return;
        }

        const validFiles: File[] = [];
        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`File "${file.name}" terlalu besar. Maksimal 10MB`);
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
        setIsExpanded(true);

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if ((!content.trim() && selectedFiles.length === 0) || isSending) return;
        if (content.length > CHAR_LIMIT) {
            toast.error("Melebihi batas karakter");
            return;
        }

        setIsSending(true);
        const tempId = createId();

        let attachments: any[] | undefined = undefined;

        try {
            // Upload files if any
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
                    throw new Error("Gagal mengunggah gambar");
                });
                attachments = await Promise.all(uploadPromises);
            }

            const optimisticPost: PostWithUserDTO = {
                id: tempId,
                content,
                userId: currentUser.id,
                visibility: "public",
                attachments: attachments || [],
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                user: {
                    username: currentUser.username,
                    avatar: currentUser.avatar,
                },
                reactions: [],
                repostCount: 0,
                replyCount: 0,
                optimisticId: tempId
            } as PostWithUserDTO;

            await optimisticPostRepository.savePendingPost(optimisticPost);

            const response = await createPostAction(currentUser.id, content, attachments, undefined, undefined, tempId);
            if (response.status === "success" && response.data) {
                onPostCreated(response.data);
                setContent("");
                localStorage.removeItem("draft_global-post");
                setSelectedFiles([]);
                setFilePreviews([]);
                setIsExpanded(false);
                toast.success("Kiriman berhasil dibuat");
            } else {
                await optimisticPostRepository.removePendingPost(tempId);
                toast.error(response.error?.message || "Gagal membuat kiriman");
            }
        } catch (error: any) {
            await optimisticPostRepository.removePendingPost(tempId);
            toast.error(error.message || "Terjadi kesalahan");
        } finally {
            setIsSending(false);
        }
    };

    // Support paste image
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            if (!isExpanded) return;
            const items = Array.from(e.clipboardData?.items || []);
            const imageItems = items.filter(item => item.type.startsWith("image/"));

            if (imageItems.length === 0) return;

            if (selectedFiles.length + imageItems.length > MAX_FILES) {
                toast.error(`Maksimal ${MAX_FILES} gambar per postingan`);
                return;
            }

            const newFiles: File[] = [];
            for (const item of imageItems) {
                const file = item.getAsFile();
                if (file && file.size <= MAX_FILE_SIZE) {
                    newFiles.push(file);
                }
            }

            if (newFiles.length > 0) {
                const newPreviews = await Promise.all(
                    newFiles.map(async (file) => ({
                        file,
                        preview: await generatePreview(file),
                    }))
                );

                setSelectedFiles((prev) => [...prev, ...newFiles]);
                setFilePreviews((prev) => [...prev, ...newPreviews]);
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [isExpanded, selectedFiles.length]);

    const remaining = CHAR_LIMIT - content.length;
    const isOverLimit = remaining < 0;

    return (
        <div
            ref={containerRef}
            className={cn(
                "p-4 border-b border-white/5 transition-all duration-300 bg-zinc-900/40 relative",
                isExpanded ? "pb-6 shadow-2xl z-50 ring-1 ring-white/10" : "pb-4"
            )}
        >
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
            />

            <div className="flex gap-4">
                <UserAvatar src={currentUser.avatar} className="h-10 w-10 shrink-0 mt-1" />
                <div className="flex-1 flex flex-col gap-3 relative">
                    {!isExpanded ? (
                        <div className="flex items-center gap-3 w-full">
                            <div
                                onClick={() => setIsExpanded(true)}
                                className="h-11 flex-1 flex items-center text-zinc-500 cursor-text hover:bg-white/5 px-4 rounded-full border border-white/5 bg-black/20 transition-all"
                            >
                                Apa yang Anda pikirkan?
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-sky-500 rounded-full hover:bg-sky-500/10 shrink-0"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImagePlus className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <MentionTextarea
                                value={content}
                                onChange={setContent}
                                placeholder="Apa yang Anda pikirkan?"
                                onSubmit={handleSend}
                                className="min-h-[120px] bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-600 p-0 text-xl resize-none"
                                autoFocus={true}
                                currentUserId={currentUser.id}
                                draftKey="global-post"
                            />

                            {/* Previews */}
                            {filePreviews.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mb-4 mt-2">
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

                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-sky-500 rounded-full hover:bg-sky-500/10"
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Tambahkan Gambar"
                                    >
                                        <ImagePlus className="h-5 w-5" />
                                    </Button>

                                    {content.length > 0 && (
                                        <div className={cn(
                                            "text-[13px] font-medium ml-2 px-2 py-0.5 rounded-md",
                                            remaining < 20 ? "text-red-500 bg-red-500/10" : "text-zinc-500"
                                        )}>
                                            {remaining}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={handleSend}
                                    disabled={(!content.trim() && selectedFiles.length === 0) || isSending || isOverLimit}
                                    className="rounded-full bg-sky-500 text-white hover:bg-sky-600 px-6 font-bold shadow-lg shadow-sky-500/20 disabled:opacity-40 h-10 min-w-[100px]"
                                >
                                    {isSending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>Posting</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
