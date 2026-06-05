"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { createPostAction } from "@/app/posts.action";
import { uploadFileAction } from "@/app/(with-sidebar)/channels/[roomId]/messages.action";
import { toast } from "sonner";
import { PaperPlaneRight, Image as ImageIcon, X, File as FileIcon, CircleNotch, Globe, Users, Lock, CaretDown, PlusCircle, Smiley } from "@phosphor-icons/react/dist/ssr";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { optimisticPostRepository } from "@/lib/infrastructure/optimistic-post.repository";
import { createId } from "@paralleldrive/cuid2";
import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { cn } from "@/lib/utils";
import { EmojiPickerComponent } from "@/components/emoji-picker/emoji-picker";

interface ThreadItem {
    id: string;
    content: string;
    selectedFiles: File[];
    filePreviews: { file: File; preview: string | null }[];
}

interface PostInputProps {
    currentUser: {
        id: string;
        username: string;
        avatar: string;
    };
    onPostCreated: (post: any) => void;
}

export function PostInput({ currentUser, onPostCreated }: PostInputProps) {
    const [thread, setThread] = useState<ThreadItem[]>([
        { id: createId(), content: "", selectedFiles: [], filePreviews: [] }
    ]);
    const [isSending, setIsSending] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");

    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const CHAR_LIMIT = 280;
    const MAX_FILES = 4;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // Click outside to collapse
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isInsideContainer = containerRef.current?.contains(target);
            const isInsidePortal = (target as HTMLElement).closest?.('[data-radix-popper-content-wrapper]');

            if (!isInsideContainer && !isInsidePortal) {
                const isEmpty = thread.every(item => item.content.trim() === "" && item.selectedFiles.length === 0);
                if (isEmpty) {
                    setIsExpanded(false);
                    // Reset thread to single item if collapsed
                    if (thread.length > 1) {
                        setThread([{ id: createId(), content: "", selectedFiles: [], filePreviews: [] }]);
                    }
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [thread]);

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

    const handleFileSelect = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const currentItem = thread.find(item => item.id === itemId);
        if (!currentItem) return;

        if (currentItem.selectedFiles.length + files.length > MAX_FILES) {
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

        setThread(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    selectedFiles: [...item.selectedFiles, ...validFiles],
                    filePreviews: [...item.filePreviews, ...newPreviews]
                };
            }
            return item;
        }));

        setIsExpanded(true);

        if (fileInputRefs.current[itemId]) fileInputRefs.current[itemId]!.value = "";
    };

    const removeFile = (itemId: string, fileIndex: number) => {
        setThread(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    selectedFiles: item.selectedFiles.filter((_, i) => i !== fileIndex),
                    filePreviews: item.filePreviews.filter((_, i) => i !== fileIndex)
                };
            }
            return item;
        }));
    };

    const addThreadItem = () => {
        const lastItem = thread[thread.length - 1];
        if (!lastItem.content.trim() && lastItem.selectedFiles.length === 0) {
            toast.error("Isi kiriman sebelumnya sebelum menambah bagian utas baru");
            return;
        }
        setThread(prev => [...prev, { id: createId(), content: "", selectedFiles: [], filePreviews: [] }]);
    };

    const removeThreadItem = (itemId: string) => {
        if (thread.length <= 1) return;
        setThread(prev => prev.filter(item => item.id !== itemId));
    };

    const updateContent = (itemId: string, content: string) => {
        setThread(prev => prev.map(item => item.id === itemId ? { ...item, content } : item));
    };

    const handleSend = async () => {
        // Strict validation: every item must have content or media
        const invalidItems = thread.filter(item => !item.content.trim() && item.selectedFiles.length === 0);
        if (invalidItems.length > 0) {
            toast.error("Setiap bagian utas harus diisi dengan teks atau media");
            return;
        }

        const hasOverLimit = thread.some(item => item.content.length > CHAR_LIMIT);
        if (hasOverLimit) {
            toast.error("Ada kiriman yang melebihi batas karakter");
            return;
        }

        setIsSending(true);
        let lastPostId: string | undefined = undefined;
        let firstPost: PostWithUserDTO | null = null;

        try {
            for (let i = 0; i < thread.length; i++) {
                const item = thread[i];
                const tempId = createId();
                let attachments: any[] | undefined = undefined;

                // Upload files if any
                if (item.selectedFiles.length > 0) {
                    const uploadPromises = item.selectedFiles.map(async (file) => {
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

                const response = await createPostAction(
                    currentUser.id,
                    item.content,
                    attachments,
                    lastPostId, // replyToId is the previous post in thread
                    undefined,
                    tempId,
                    visibility
                );

                if (response.status === "success" && response.data) {
                    if (!firstPost) firstPost = response.data;
                    lastPostId = response.data.id;
                } else {
                    throw new Error(response.error?.message || "Gagal membuat kiriman");
                }
            }

            if (firstPost) {
                onPostCreated(firstPost);
                setThread([{ id: createId(), content: "", selectedFiles: [], filePreviews: [] }]);
                setIsExpanded(false);
                toast.success(thread.length > 1 ? "Utas berhasil dibuat" : "Kiriman berhasil dibuat");
            }

        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan");
        } finally {
            setIsSending(false);
        }
    };

    // Support paste image
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            if (!isExpanded) return;
            // Target the last item for simplicity if not focused
            const targetItemId = thread[thread.length - 1].id;

            const items = Array.from(e.clipboardData?.items || []);
            const imageItems = items.filter(item => item.type.startsWith("image/"));

            if (imageItems.length === 0) return;

            const currentItem = thread.find(item => item.id === targetItemId);
            if (!currentItem) return;

            if (currentItem.selectedFiles.length + imageItems.length > MAX_FILES) {
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

                setThread(prev => prev.map(item => {
                    if (item.id === targetItemId) {
                        return {
                            ...item,
                            selectedFiles: [...item.selectedFiles, ...newFiles],
                            filePreviews: [...item.filePreviews, ...newPreviews]
                        };
                    }
                    return item;
                }));
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [isExpanded, thread]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "p-4 border-b border-border transition-all duration-300 relative",
                isExpanded ? "pb-6 z-50" : "pb-4"
            )}
        >
            <div className="flex flex-col gap-0">
                {thread.map((item, index) => (
                    <div key={item.id} className="flex gap-4 relative group/item">
                        {/* Thread Line */}
                        {index < thread.length - 1 && (
                            <div className="absolute left-5 top-11 bottom-0 w-0.5 bg-border/60 -z-10" />
                        )}

                        <div className="flex flex-col items-center shrink-0">
                            <UserAvatar src={currentUser.avatar} className="h-10 w-10 shrink-0 mt-1" />
                        </div>

                        <div className="flex-1 flex flex-col gap-2 relative pb-4">
                            {!isExpanded ? (
                                <div className="flex items-center gap-3 w-full">
                                    <div
                                        onClick={() => setIsExpanded(true)}
                                        className="h-11 flex-1 flex items-center text-muted-foreground cursor-text hover:bg-accent/50 px-4 rounded-full border border-border transition-all"
                                    >
                                        Apa yang Anda pikirkan?
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-brand rounded-full hover:bg-brand/10 hover:text-brand/80 shrink-0 transition-colors"
                                        onClick={() => {
                                            setIsExpanded(true);
                                            setTimeout(() => fileInputRefs.current[item.id]?.click(), 0);
                                        }}
                                    >
                                        <ImageIcon className="h-5 w-5" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="relative">
                                        <MentionTextarea
                                            value={item.content}
                                            onChange={(val) => {
                                                updateContent(item.id, val);
                                            }}
                                            placeholder={index === 0 ? "Apa yang Anda pikirkan?" : "Tambah kiriman lain..."}
                                            onSubmit={handleSend}
                                            className="min-h-[100px] bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/60 p-0 text-xl resize-none"
                                            autoFocus={index === thread.length - 1}
                                            currentUserId={currentUser.id}
                                        />
                                        {thread.length > 1 && (
                                            <button
                                                onClick={() => removeThreadItem(item.id)}
                                                className="absolute -right-2 top-0 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover/item:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Previews per Item */}
                                    {item.filePreviews.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mb-2 mt-2">
                                            {item.filePreviews.map((fileItem, fIndex) => (
                                                <div key={fIndex} className="relative aspect-video rounded-xl overflow-hidden border border-border group">
                                                    {fileItem.preview ? (
                                                        fileItem.file.type.startsWith("video/") ? (
                                                            <video src={fileItem.preview} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <img src={fileItem.preview} className="w-full h-full object-cover" alt="preview" />
                                                        )
                                                    ) : (
                                                        <div className="w-full h-full bg-accent flex items-center justify-center">
                                                            <FileIcon className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => removeFile(item.id, fIndex)}
                                                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 p-1.5 rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Per-item Actions Bar */}
                                    <div className="flex items-center justify-between py-1">
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="file"
                                                className="hidden"
                                                ref={el => { fileInputRefs.current[item.id] = el }}
                                                multiple
                                                accept="image/*,video/*"
                                                onChange={(e) => handleFileSelect(item.id, e)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-brand rounded-full hover:bg-brand/10 hover:text-brand/80 transition-colors"
                                                onClick={() => fileInputRefs.current[item.id]?.click()}
                                                title="Tambahkan Gambar"
                                            >
                                                <ImageIcon className="h-4 w-4" />
                                            </Button>

                                            <EmojiPickerComponent
                                                onEmojiSelect={(emoji) => {
                                                    updateContent(item.id, item.content + emoji);
                                                }}
                                                triggerClassName="h-8 w-8 text-brand rounded-full hover:bg-brand/10 hover:text-brand/80 transition-colors flex items-center justify-center"
                                            />

                                            {index === thread.length - 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-brand rounded-full hover:bg-brand/10 hover:text-brand/80 transition-colors"
                                                    onClick={addThreadItem}
                                                    disabled={!item.content.trim() && item.selectedFiles.length === 0}
                                                    title="Tambah ke Utas"
                                                >
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {item.content.length > 0 && (
                                                <div className={cn(
                                                    "text-[11px] font-medium px-1.5 py-0.5 rounded-md",
                                                    (CHAR_LIMIT - item.content.length) < 20 ? "text-destructive bg-destructive/10" : "text-muted-foreground/60"
                                                )}>
                                                    {CHAR_LIMIT - item.content.length}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Final Footer for the Last Item */}
                                    {index === thread.length - 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                                            <div className="flex items-center gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-9 px-3 gap-1.5 text-brand rounded-full hover:bg-brand/10 hover:text-brand/80 transition-all">
                                                            {visibility === "public" ? <Globe className="h-4 w-4" /> : visibility === "unlisted" ? <Users className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                            <span className="text-[13px] font-medium">
                                                                {visibility === "public" ? "Publik" : visibility === "unlisted" ? "Pengikut" : "Privat"}
                                                            </span>
                                                            <CaretDown className="h-3.5 w-3.5 opacity-50" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="bg-popover border-border text-popover-foreground w-48 z-[1000]">
                                                        <DropdownMenuItem onClick={() => setVisibility("public")} className="cursor-pointer focus:bg-accent gap-3 py-2.5">
                                                            <div className="h-8 w-8 rounded-full bg-accent/50 flex items-center justify-center text-foreground">
                                                                <Globe className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] font-bold">Publik</span>
                                                                <span className="text-[11px] text-muted-foreground">Dapat dilihat siapa saja</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setVisibility("unlisted")} className="cursor-pointer focus:bg-accent gap-3 py-2.5">
                                                            <div className="h-8 w-8 rounded-full bg-accent/50 flex items-center justify-center text-foreground">
                                                                <Users className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] font-bold">Hanya Pengikut</span>
                                                                <span className="text-[11px] text-muted-foreground">Hanya pengikut Anda</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setVisibility("private")} className="cursor-pointer focus:bg-accent gap-3 py-2.5">
                                                            <div className="h-8 w-8 rounded-full bg-accent/50 flex items-center justify-center text-foreground">
                                                                <Lock className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] font-bold">Privat</span>
                                                                <span className="text-[11px] text-muted-foreground">Hanya Anda yang melihat</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <Button
                                                onClick={handleSend}
                                                disabled={isSending || thread.some(it => !it.content.trim() && it.selectedFiles.length === 0)}
                                                className="rounded-full bg-brand hover:bg-brand/90 text-primary-foreground px-6 font-bold disabled:opacity-40 h-10 min-w-[100px] shadow-none"
                                            >
                                                {isSending ? (
                                                    <CircleNotch className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>{thread.length > 1 ? "Posting Utas" : "Posting"}</>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
