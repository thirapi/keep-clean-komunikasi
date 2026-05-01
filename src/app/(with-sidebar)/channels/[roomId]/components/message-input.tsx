// src/app/(with-sidebar)/channels/[roomId]/components/message-input.tsx
"use client";

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { createMessage, uploadFileAction } from "../messages.action";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { debounce } from "lodash";
import { setTypingStatusAction } from "../messages.action";
import { pusher } from "@/lib/pusher/pusher.client";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { RoomRecord } from "@/lib/entities/models/room.model";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { CornerLeftUp, Loader2, X, Paperclip, Image as ImageIcon, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  roomData: RoomRecord;
  replyingTo: MessageWithUserDTO | null;
  onCancelReply: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onNewMessage: (message: MessageWithUserDTO) => void;
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
  user,
}: Props) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { displayNames } = useTypingIndicator(roomData.id, userId);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File terlalu besar. Maksimal 10MB");
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if ((!content.trim() && !selectedFile) || isSending || !userId) return;

      setIsSending(true);
      sendStopTypingEvent.cancel();
      if (userId) setTypingStatusAction(userId, roomData.id, false);

      let uploadedUrl: string | undefined = undefined;

      try {
        if (selectedFile) {
          const formData = new FormData();
          formData.append("file", selectedFile);
          const uploadResponse = await uploadFileAction(formData, `channels/${roomData.id}`);
          if (uploadResponse.status === "success" && uploadResponse.data) {
            uploadedUrl = uploadResponse.data.fileurl;
          } else {
            throw new Error(uploadResponse.error?.message || "Gagal mengunggah file");
          }
        }

        // Optimistic message
        const optimisticId = `optimistic-${Date.now()}`;
        const optimisticMessage: MessageWithUserDTO = {
          id: optimisticId,
          content,
          userId,
          roomId: roomData.id,
          imageUrl: uploadedUrl || (filePreview && selectedFile?.type.startsWith("image/") ? filePreview : null),
          replyTo: replyingTo?.id || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOptimistic: true,
          user: {
            username: user.username,
            avatar: user.avatar,
          },
        } as any;

        onNewMessage(optimisticMessage);
        const currentContent = content;
        const currentReplyTo = replyingTo?.id;
        
        setContent("");
        clearFile();
        onCancelReply();

        const response = await createMessage(
          userId,
          currentContent,
          roomData.id,
          uploadedUrl,
          currentReplyTo
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
      selectedFile,
      isSending,
      userId,
      roomData.id,
      replyingTo?.id,
      onCancelReply,
      sendStopTypingEvent,
      onNewMessage,
      user.username,
      user.avatar,
      filePreview,
    ],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        if (!content.trim() && !selectedFile) {
          e.preventDefault();
        }
      } else {
        e.preventDefault();
        handleSend();
      }
    } else if (e.key === "Escape" && replyingTo) {
      onCancelReply();
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
    const handlePaste = (e: ClipboardEvent) => {
      const item = e.clipboardData?.items[0];
      if (item?.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            toast.error("Gambar terlalu besar. Maksimal 10MB");
            return;
          }
          setSelectedFile(file);
          const reader = new FileReader();
          reader.onloadend = () => setFilePreview(reader.result as string);
          reader.readAsDataURL(file);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <div className="flex flex-col gap-0 px-3 sm:px-6 pb-4 sm:pb-6">
      {/* File Preview */}
      {selectedFile && (
        <div className="relative rounded-t-xl bg-muted/30 border-x border-t border-border/50 backdrop-blur-md px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {filePreview ? (
            <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-border/50 shadow-sm">
              <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center border border-border/50 shadow-sm">
              <FileIcon className="h-8 w-8 text-primary/60" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{selectedFile.name}</div>
            <div className="text-[10px] text-muted-foreground uppercase">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={clearFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {replyingTo && (
        <div className={cn(
          "relative bg-muted/50 border-x border-border/50 backdrop-blur-md px-4 py-3 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
          selectedFile ? "border-t border-border/20" : "rounded-t-xl border-t"
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

      <div
        className={cn(
          "flex items-end gap-2 bg-muted/40 backdrop-blur-xl border border-border/50 p-1.5 pr-2 shadow-2xl transition-all duration-300 ring-1 ring-black/5",
          (replyingTo || selectedFile) ? "rounded-b-xl border-t-0" : "rounded-xl",
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="h-9 w-9 mb-0.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative flex items-center">
          <textarea
            autoFocus
            ref={inputRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleTyping();
            }}
            onBlur={() => {
              sendStopTypingEvent();
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Tulis pesan di #${roomData.name}`}
            className="flex-1 bg-transparent border-none text-foreground placeholder-muted-foreground/60 focus:outline-none ring-0 resize-none min-h-[40px] max-h-[200px] px-3 py-2.5 text-[14px] leading-relaxed overflow-y-auto"
            rows={1}
          />
        </div>

        <Button
          onClick={() => handleSend()}
          disabled={(!content.trim() && !selectedFile) || isSending}
          className="h-9 w-9 p-0 mb-0.5 rounded-lg bg-primary hover:brightness-110 transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-30 disabled:grayscale"
        >
          {isSending ? (
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
