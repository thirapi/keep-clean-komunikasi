// src/app/(with-sidebar)/channels/[roomId]/components/message-input.tsx
"use client";

import { useEffect, useRef, useState, useCallback, useLayoutEffect, useMemo } from "react";
import { createMessage, uploadFileAction } from "../messages.action";
import { createId } from "@paralleldrive/cuid2";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { debounce } from "lodash";
import { setTypingStatusAction } from "../messages.action";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { RoomRecord } from "@/lib/entities/models/room.model";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { CornerLeftUp, X, Paperclip, FileIcon, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPickerComponent } from "./emoji-picker";
import { MarkdownToolbar } from "./markdown-toolbar";

interface Props {
  userId: string;
  roomData: RoomRecord;
  replyingTo: MessageWithUserDTO | null;
  onCancelReply: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onNewMessage: (message: MessageWithUserDTO) => void;
  onStartEditLast: () => void;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

export function MessageInput({
  userId,
  roomData,
  replyingTo,
  onCancelReply,
  inputRef,
  onNewMessage,
  onStartEditLast,
  user,
}: Props) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ file: File; preview: string | null }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { displayNames } = useTypingIndicator(roomData.id, userId);

  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for video support

  const sendTypingEvent = useRef(
    debounce(() => {
      setTypingStatusAction(userId, roomData.id, true);
    }, 300),
  ).current;

  const sendStopTypingEvent = useRef(
    debounce(() => {
      setTypingStatusAction(userId, roomData.id, false);
    }, 5000),
  ).current;

  // Auto-resize logic
  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [content, inputRef]);

  const handleTyping = useCallback(() => {
    if (!userId) return;
    sendTypingEvent();
    sendStopTypingEvent();
  }, [sendTypingEvent, sendStopTypingEvent, userId]);

  const generatePreview = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        // For video, we could generate a thumbnail, but for now we'll just indicate it's a video
        // or let the browser handle it if we used a <video> element.
        // For preview, we'll return a special string 'video-preview' or similar
        // to be handled in the UI.
        const url = URL.createObjectURL(file);
        resolve(url);
      } else {
        resolve(null);
      }
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > MAX_FILES) {
      toast.error(`Maksimal ${MAX_FILES} file per pesan`);
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

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };



  const handleSend = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if ((!content.trim() && selectedFiles.length === 0) || isSending || !userId) return;

      setIsSending(true);
      sendStopTypingEvent.cancel();
      if (userId) setTypingStatusAction(userId, roomData.id, false);

      let attachments: { url: string; key: string; fileType: string; size?: number }[] | undefined = undefined;

      try {
        if (selectedFiles.length > 0) {
          const uploadPromises = selectedFiles.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const uploadResponse = await uploadFileAction(formData, `channels/${roomData.id}`);
            if (uploadResponse.status === "success" && uploadResponse.data) {
              return {
                url: uploadResponse.data.fileurl,
                key: uploadResponse.data.filename,
                fileType: uploadResponse.data.mimetype,
                size: uploadResponse.data.size,
              };
            } else {
              throw new Error(uploadResponse.error?.message || `Gagal mengunggah file ${file.name}`);
            }
          });

          attachments = await Promise.all(uploadPromises);
        }

        // Optimistic message
        const optimisticId = createId();
        const optimisticMessage: MessageWithUserDTO = {
          id: `optimistic-${optimisticId}`,
          content,
          userId,
          roomId: roomData.id,
          attachments: attachments || selectedFiles.map((file, index) => ({
            id: `temp-${index}`,
            url: filePreviews[index]?.preview || '',
            key: file.name,
            fileType: file.type,
            size: file.size,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          replyTo: replyingTo?.id || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOptimistic: true,
          optimisticId,
          user: {
            username: user.username,
            avatar: user.avatar,
          },
        } as any;

        onNewMessage(optimisticMessage);
        const currentContent = content;
        const currentReplyTo = replyingTo?.id;

        setContent("");
        clearAllFiles();
        onCancelReply();



        const response = await createMessage(
          userId,
          currentContent,
          roomData.id,
          currentReplyTo,
          attachments,
          optimisticId
        );

        if (response.status === "success" && response.data) {
          onNewMessage(response.data);
        } else {
          console.error("Gagal mengirim pesan:", response.error);
          toast.error(response.error?.message);
        }
      } catch (err: any) {
        toast.error(err.message || "Terjadi kesalahan saat mengirim pesan");
      } finally {
        setIsSending(false);
      }
    },
    [
      content,
      selectedFiles,
      filePreviews,
      isSending,
      userId,
      roomData.id,
      replyingTo?.id,
      onCancelReply,
      sendStopTypingEvent,
      onNewMessage,
      user.username,
      user.avatar,
    ],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        if (!content.trim() && selectedFiles.length === 0) {
          e.preventDefault();
        }
      } else {
        e.preventDefault();
        handleSend();
      }
    } else if (e.key === "Escape") {
      if (replyingTo) onCancelReply();
    } else if (e.key === "ArrowUp" && !content.trim() && !replyingTo) {
      e.preventDefault();
      onStartEditLast();
    }
  };

  useEffect(() => {
    return () => {
      sendTypingEvent.cancel();
      sendStopTypingEvent.cancel();
    };
  }, [sendTypingEvent, sendStopTypingEvent]);

  // Support paste image
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItems = items.filter(item => item.type.startsWith("image/"));

      if (imageItems.length === 0) return;

      if (selectedFiles.length + imageItems.length > MAX_FILES) {
        toast.error(`Maksimal ${MAX_FILES} file per pesan`);
        return;
      }

      const newFiles: File[] = [];
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          if (file.size > MAX_FILE_SIZE) {
            toast.error(`Gambar "${file.name}" terlalu besar. Maksimal 10MB`);
            continue;
          }
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
  }, [selectedFiles.length]);

  const highlightRef = useRef<HTMLDivElement>(null);

  const syncScroll = useCallback(() => {
    if (inputRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = inputRef.current.scrollTop;
    }
  }, [inputRef]);

  // Sync scroll on content change or scroll event
  useEffect(() => {
    syncScroll();
  }, [content, syncScroll]);

  return (
    <div className="flex flex-col gap-0 px-3 sm:px-6 pb-4 sm:pb-6">
      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="relative rounded-t-xl bg-muted/30 border-x border-t border-border/50 backdrop-blur-md px-4 py-3 flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {filePreviews.map((item, index) => (
            <div key={index} className="relative group h-20 w-20 sm:h-24 sm:w-24 rounded-lg overflow-hidden border border-border/50 shadow-sm bg-background/50">
              {item.preview ? (
                item.file.type.startsWith("video/") ? (
                  <div className="h-full w-full relative">
                    <video src={item.preview} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="bg-primary/80 rounded-full p-1.5 shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={item.preview} alt="Preview" className="h-full w-full object-cover" />
                )
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center p-2 text-center">
                  <FileIcon className="h-8 w-8 text-primary/60 mb-1" />
                  <span className="text-[10px] truncate w-full px-1">{item.file.name}</span>
                </div>
              )}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 rounded-full shadow-lg"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[9px] text-white px-1 py-0.5 truncate backdrop-blur-sm">
                {(item.file.size / 1024).toFixed(0)} KB
              </div>
            </div>
          ))}
          {selectedFiles.length < MAX_FILES && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all bg-muted/20"
            >
              <Paperclip className="h-6 w-6 mb-1" />
              <span className="text-[10px]">Tambah</span>
            </button>
          )}
        </div>
      )}



      {replyingTo && (
        <div className={cn(
          "relative bg-muted/50 border-x border-border/50 backdrop-blur-md px-4 py-3 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
          selectedFiles.length > 0 ? "border-t border-border/20" : "rounded-t-xl border-t"
        )}>
          <div className="bg-primary/20 p-1.5 rounded-lg">
            <CornerLeftUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-primary mb-0.5">
              Replying to {replyingTo.user.username}
            </div>
            <div className="text-sm text-muted-foreground/80 line-clamp-1 italic">
              "{replyingTo.content}"
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Live Markdown Preview removed in favor of inline highlighting */}


      <div
        className={cn(
          "flex items-end gap-1 bg-muted/40 backdrop-blur-xl border border-border/50 p-1.5 pr-2 shadow-2xl transition-all duration-300 ring-1 ring-black/5",
          (replyingTo || selectedFiles.length > 0) ? "rounded-b-xl border-t-0" : "rounded-xl",
        )}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />

        <div className="flex items-center gap-0.5 h-9 mb-0.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Paperclip className="h-4.5 w-4.5" />
          </Button>
          <EmojiPickerComponent
            onEmojiSelect={(emoji) => {
              setContent((prev) => prev + emoji);
              inputRef.current?.focus();
            }}
          />
          <MarkdownToolbar
            textareaRef={inputRef as any}
            onApplyMarkdown={(newContent) => {
              setContent(newContent);
              handleTyping();
            }}
          />
        </div>

        <div className="flex-1 relative min-h-[40px] max-h-[200px] mb-0.5">
          <div
            ref={highlightRef}
            aria-hidden="true"
            className="absolute inset-0 px-3 py-2 text-[14px] leading-relaxed whitespace-pre-wrap break-words pointer-events-none overflow-hidden text-foreground/90 select-none font-sans"
            dangerouslySetInnerHTML={{
              __html: content
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                // Bold: **text**
                .replace(/(\*\*)(.*?)(\*\*)/g, '<span class="text-muted-foreground/30">$1</span><span class="font-bold text-foreground">$2</span><span class="text-muted-foreground/30">$3</span>')
                // Italic: _text_
                .replace(/(_)(.*?)(_)/g, '<span class="text-muted-foreground/30">$1</span><span class="italic text-foreground">$2</span><span class="text-muted-foreground/30">$3</span>')
                // Strikethrough: ~~text~~
                .replace(/(~~)(.*?)(~~)/g, '<span class="text-muted-foreground/30">$1</span><span class="line-through opacity-70">$2</span><span class="text-muted-foreground/30">$3</span>')
                // Code Block: ```text``` (multiline)
                .replace(/(```[\s\S]+?```)/g, '<span class="text-primary/40 opacity-60">$1</span>')
                // Inline Code: `text`
                .replace(/(`)([^`]+?)(`)/g, '<span class="text-muted-foreground/40">$1</span><span class="bg-[#F8F8F8] dark:bg-[#2D2D2D] px-1 rounded border border-[#E1E1E1] dark:border-[#3D3D3D] text-[#E01E5A] dark:text-[#FF7B72]">$2</span><span class="text-muted-foreground/40">$3</span>')                // Blockquote: > text
                .replace(/^(&gt;)(.*)/gm, '<span class="text-primary/40">$1</span><span class="italic opacity-80 border-l-2 border-primary/20 pl-1 ml-0.5">$2</span>')
                // Header: # text
                .replace(/^(#{1,6}\s)(.*)/gm, '<span class="text-primary/40">$1</span><span class="font-bold text-primary">$2</span>')
                // URL/Links (Basic)
                .replace(/(https?:\/\/[^\s]+)/g, '<span class="text-sky-400 underline opacity-90">$1</span>')
                + (content.endsWith('\n') ? '\n ' : '')
            }}
          />
          <textarea
            autoFocus
            ref={inputRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleTyping();
            }}
            onScroll={syncScroll}
            onBlur={() => {
              sendStopTypingEvent();
            }}
            onKeyDown={handleKeyDown}
            spellCheck="false"
            placeholder={`Tulis pesan di #${roomData.name}`}
            className="relative w-full h-full bg-transparent border-none text-transparent caret-foreground placeholder-muted-foreground/60 focus:outline-none ring-0 resize-none px-3 py-2 text-[14px] leading-relaxed overflow-y-auto font-sans selection:bg-primary/25 selection:text-transparent"
            rows={1}
          />
        </div>

        <Button
          onClick={() => handleSend()}
          disabled={(!content.trim() && selectedFiles.length === 0) || isSending}
          className="h-9 w-9 p-0 mb-0.5 rounded-lg bg-primary hover:brightness-110 transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-30 disabled:grayscale"
        >          {isSending ? (
            <div className="flex items-center justify-center gap-1">
              {[0, 0.2, 0.4].map((delay, i) => (
                <div
                  key={i}
                  className="h-1 w-1 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          ) : (
            <CornerLeftUp className="h-5 w-5 rotate-90" />
          )}
        </Button>
      </div>

      <div className="h-5 text-sm text-muted-foreground italic transition-opacity duration-200 ease-in-out flex items-center">
        {displayNames.length > 0 && (
          <div className="flex items-center">
            <span>
              {displayNames.join(", ")} {displayNames.length > 1 ? "are" : "is"}{" "}
              typing
            </span>
            <div className="flex items-center justify-center gap-0.5 pl-1 pt-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
