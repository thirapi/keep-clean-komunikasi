"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { createPostAction } from "@/app/posts.action";
import { uploadFileAction } from "@/app/(with-sidebar)/channels/[roomId]/messages.action";
import { toast } from "sonner";
import { ImagePlus, X, FileIcon, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface SimpleReplyInputProps {
    currentUser: {
        id: string;
        username: string;
        avatar: string;
    };
    postId: string;
    onReplyCreated: (reply: any) => void;
    showConnector?: boolean;
}

export function SimpleReplyInput({ currentUser, postId, onReplyCreated, showConnector }: SimpleReplyInputProps) {
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<{ file: File; preview: string | null }[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const CHAR_LIMIT = 280;
    const MAX_FILES = 4;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // Auto-expand textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "inherit";
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [content]);

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
            toast.error(`Maksimal ${MAX_FILES} file media per balasan`);
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
                    throw new Error("Gagal mengunggah media");
                });
                attachments = await Promise.all(uploadPromises);
            }

            const response = await createPostAction(currentUser.id, content, attachments, postId);
            if (response.status === "success" && response.data) {
                onReplyCreated(response.data);
                setContent("");
                setSelectedFiles([]);
                setFilePreviews([]);
                toast.success("Balasan terkirim");
            } else {
                toast.error(response.error?.message || "Gagal membalas");
            }
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan");
        } finally {
            setIsSending(false);
        }
    };

    const remaining = CHAR_LIMIT - content.length;
    const isOverLimit = remaining < 0;

    const gutterWidth = "w-10 md:w-12";
    const lineX = "left-[31px] md:left-[39px]";

    return (
        <div className="flex items-start gap-0 px-4 py-4 border-b border-border/50 relative bg-background select-none">
            {showConnector && (
                <div className={cn("absolute w-[2px] bg-border z-0 top-0 h-[30px]", lineX)} />
            )}

            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
            />

            <div className={cn("shrink-0 z-10 relative flex flex-col items-center", gutterWidth)}>
                <UserAvatar src={currentUser.avatar} className="h-10 w-10 shrink-0" />
            </div>
            
            <div className="flex-1 flex flex-col gap-2 min-w-0 pt-0 pl-3 md:pl-4">
                <div className="flex flex-col gap-2">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Ketik balasan Anda..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-[18px] md:text-[20px] placeholder:text-muted-foreground/60 p-0 min-h-[40px] w-full resize-none leading-normal"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                handleSend();
                            }
                        }}
                    />

                    {/* Previews */}
                    {filePreviews.length > 0 && (
                        <div className={cn(
                            "grid gap-2 mb-2 rounded-2xl overflow-hidden border border-border",
                            filePreviews.length === 1 ? "grid-cols-1" : "grid-cols-2"
                        )}>
                            {filePreviews.map((item, index) => (
                                <div key={index} className="relative aspect-video bg-muted group overflow-hidden">
                                    {item.preview ? (
                                        item.file.type.startsWith("video/") ? (
                                            <video src={item.preview} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={item.preview} className="w-full h-full object-cover" alt="preview" />
                                        )
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileIcon className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 p-1.5 rounded-full text-white backdrop-blur-md transition-all shadow-lg"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-border/10 pt-3">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-sky-500 rounded-full hover:bg-sky-500/10 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                title="Tambahkan Gambar"
                            >
                                <ImagePlus className="h-[18px] w-[18px]" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-4">
                            {content.length > 0 && (
                                <div className={cn(
                                    "text-[13px] font-medium tabular-nums",
                                    remaining < 0 ? "text-destructive" : remaining < 20 ? "text-amber-500" : "text-muted-foreground"
                                )}>
                                    {remaining}
                                </div>
                            )}
                            
                            <Button
                                onClick={handleSend}
                                disabled={(!content.trim() && selectedFiles.length === 0) || isSending || isOverLimit}
                                className="rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 h-9 text-[15px] transition-colors shadow-sm shrink-0"
                            >
                                {isSending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>Balas</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
