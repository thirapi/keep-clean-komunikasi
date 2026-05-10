import React from "react";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { YouTubeEmbed } from "@/components/ui/youtube-embed";
import { XEmbed } from "@/components/ui/x-embed";
import { UserAvatar } from "@/components/ui/user-avatar";

// Module-level constants — compiled once, not on every render
const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const X_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)/;
// Extracts all URL tokens from message text, stripping trailing punctuation
const URL_TOKEN_REGEX = /https?:\/\/[^\s]+/g;
import { CornerLeftUp, CornerUpLeft, MessageSquare, FileIcon, Download, ExternalLink, Trash2, Copy } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createRoom } from "../room.action";
import { deleteMessageAction } from "../messages.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImageLightbox, ImageSource } from "@/components/ui/image-lightbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function truncate(str: string, max = 100) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export function MessageItem({
  message,
  onlineUserIds,
  onReply,
  currentUserId,
  isContinuation,
  isAfterSeparator,
  isHighlighted,
  onScrollToMessage,
}: {
  message: MessageWithUserDTO;
  onlineUserIds: string[];
  onReply: (message: MessageWithUserDTO) => void;
  currentUserId: string;
  isContinuation?: boolean;
  isAfterSeparator?: boolean;
  isHighlighted?: boolean;
  onScrollToMessage?: (messageId: string) => void;
}) {
  const router = useRouter();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const isMobile = useIsMobile();

  // Auto hide mobile actions after 3.5s to free up screen and prevent stuck UI
  useEffect(() => {
    if (showMobileActions) {
      const timer = setTimeout(() => setShowMobileActions(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showMobileActions]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mobileActionOpen, setMobileActionOpen] = useState(false);

  const handleStartDM = async (targetUserId: string) => {
    if (targetUserId === currentUserId) return;

    const response = await createRoom(currentUserId, targetUserId);
    if (response.status === "success" && response.data) {
      router.push(`/channels/${response.data.id}`);
    } else {
      toast.error(response.error?.message || "Gagal membuat percakapan");
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    const response = await deleteMessageAction(currentUserId, message.id);
    if (response.status === "error") {
      toast.error(response.error?.message || "Gagal menghapus pesan");
      setIsDeleting(false);
    } else {
      toast.success("Pesan dihapus");
      setDeleteConfirmOpen(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
    toast.success("Teks disalin");
    setMobileActionOpen(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatTimestamp = (date: Date) => {
    const isToday = (d: Date) => {
      const now = new Date();
      return d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
    };

    const time = formatTime(date);
    if (!isToday(date)) {
      const dateStr = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      return `${dateStr}, ${time}`;
    }
    return time;
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || url.startsWith('data:image/');
  };

  const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg)$/i.test(url) || url.startsWith('data:video/');
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      // Remove timestamp prefix if exists (e.g. 123456789-filename.pdf)
      return lastPart.replace(/^\d+-/, '');
    } catch {
      return 'Attachment';
    }
  };

  const imagesAndVideos = useMemo(() => {
    return (message.attachments || [])
      .filter(a => isImage(a.url) || isVideo(a.url))
      .map(a => ({
        url: a.url,
        filename: getFileName(a.url),
        type: isVideo(a.url) ? 'video' : 'image'
      }));
  }, [message.attachments]);

  const otherFiles = useMemo(() => {
    return (message.attachments || []).filter(a => !isImage(a.url) && !isVideo(a.url));
  }, [message.attachments]);

  const openLightbox = (index: number) => {
    setInitialImageIndex(index);
    setLightboxOpen(true);
  };

  const socialEmbeds = useMemo(() => {
    if (!message.content) return [];

    // Extract all URLs from the message, stripping trailing punctuation (.,!?)
    const urls = Array.from(message.content.matchAll(URL_TOKEN_REGEX), (m) =>
      m[0].replace(/[.,!?]+$/, "")
    );

    const embeds: React.ReactNode[] = [];
    const seen = new Set<string>();

    urls.forEach((url) => {
      if (seen.has(url)) return;
      seen.add(url);

      const ytMatch = url.match(YOUTUBE_REGEX);
      if (ytMatch) {
        embeds.push(<YouTubeEmbed key={url} videoId={ytMatch[1]} />);
        return;
      }

      const xMatch = url.match(X_REGEX);
      if (xMatch) {
        embeds.push(<XEmbed key={url} tweetUrl={url} />);
      }
    });

    return embeds;
  }, [message.content]);

  const renderContent = (content: string) => {
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/g;
    return content.split(urlRegex).map((part, index) => {
      if (part.match(/^(https?:\/\/|www\.)/)) {
        const href = part.startsWith("www.") ? `https://${part}` : part;
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const isOnline = onlineUserIds.includes(message.userId);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative group flex items-start gap-4 px-4 transition-all duration-300 ease-in-out cursor-default",
        isContinuation
          ? "pt-0"
          : cn("pt-2 hover:bg-muted/40 first:mt-0", isAfterSeparator ? "mt-1" : "mt-4"),
        isHovered && isContinuation && "bg-muted/30",
        isHighlighted && "bg-primary/10 ring-1 ring-primary/20 scale-[1.01] z-10",
        showMobileActions && isMobile && "bg-muted/40"
      )}
      onClick={() => {
        if (isMobile) setShowMobileActions(!showMobileActions);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative pt-0.5 w-9 shrink-0 flex justify-center">
        {!isContinuation ? (
          <>
            <UserAvatar
              src={message.user?.avatar || "/avatars/avatar1.png"}
              alt={message.user?.username}
              className="w-9 h-9 rounded-md ring-1 ring-border/50"
            />
            <div
              className={`h-2.5 w-2.5 ring-2 ring-background rounded-full absolute -bottom-0.5 -right-0.5 ${isOnline
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : "bg-muted-foreground/30"
                }`}
            ></div>
          </>
        ) : (
          <span className={cn(
            "text-[9px] text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-opacity mt-1.5 font-medium",
            isHovered && "opacity-100"
          )}>
            {formatTime(new Date(message.createdAt))}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {!isContinuation && (
          <div className="flex items-baseline gap-2">
            <HoverCard openDelay={200}>
              <HoverCardTrigger asChild>
                <span className="cursor-pointer text-sm font-bold text-foreground hover:underline decoration-primary/50 underline-offset-2">
                  {message.user?.username ?? "Unknown User"}
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 glass shadow-xl border-border/50">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={message.user?.avatar || "/avatars/avatar1.png"}
                      alt={message.user?.username}
                      className="w-12 h-12 rounded-lg ring-2 ring-primary/20"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {message.user?.username ?? "Unknown User"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        {isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                  {message.userId !== currentUserId && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full gap-2 h-9 text-xs font-semibold shadow-lg shadow-primary/20"
                      onClick={() => handleStartDM(message.userId)}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Kirim Pesan
                    </Button>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>

            <span className="text-[10px] font-medium text-muted-foreground/60">
              {formatTimestamp(new Date(message.createdAt))}
            </span>
          </div>
        )}

        {message.replyToMessage && (
          <div
            className="flex items-center gap-2 mt-0.5 mb-1 group/reply cursor-pointer hover:bg-primary/5 p-1 rounded-sm transition-colors border-l-2 border-primary/20 pl-2"
            onClick={() => message.replyTo && onScrollToMessage?.(message.replyTo)}
          >
            <CornerLeftUp className="h-3 w-3 text-primary/60" />
            <div className="text-[11px] text-muted-foreground line-clamp-1">
              <span className="font-bold text-primary/70">
                @{message.replyToMessage.user?.username ?? "user"}
              </span>
              <span className="ml-1 opacity-80 italic">
                {truncate(message.replyToMessage.content, 60)}
              </span>
            </div>
          </div>
        )}

        {message.content && (
          <div
            className="
              text-[13.5px] leading-relaxed text-foreground/90 mt-0.5
              whitespace-pre-wrap
              break-words
              pr-10
              "
          >
            {renderContent(message.content)}
          </div>
        )}

        {socialEmbeds.length > 0 && (
          <div className="flex flex-col gap-1">
            {socialEmbeds}
          </div>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-col gap-2 mt-2 max-w-[500px]">
            {imagesAndVideos.length > 0 && (
              <div className={cn(
                "grid gap-1 overflow-hidden rounded-xl border border-border/50 bg-muted/20 shadow-sm",
                imagesAndVideos.length === 1 && "grid-cols-1 max-w-sm",
                imagesAndVideos.length === 2 && "grid-cols-2",
                imagesAndVideos.length >= 3 && "grid-cols-2",
              )}>
                {imagesAndVideos.slice(0, 4).map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "relative group-media cursor-zoom-in overflow-hidden aspect-square sm:aspect-auto",
                      imagesAndVideos.length === 1 ? "aspect-auto max-h-[400px]" : "aspect-[4/3]",
                      imagesAndVideos.length === 3 && idx === 0 && "col-span-2 aspect-[2/1]",
                    )}
                    onClick={(e) => { e.stopPropagation(); openLightbox(idx); }}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full relative">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-media:hover:bg-black/40 transition-colors">
                          <div className="bg-primary/80 rounded-full p-3 shadow-xl transform transition-transform group-media:hover:scale-110">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="w-full h-full object-cover transition-transform duration-500 group-media:hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-media:hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ExternalLink className="w-8 h-8 text-white opacity-0 group-media:hover:opacity-100 transition-all scale-75 group-media:hover:scale-100 drop-shadow-lg" />
                    </div>
                    {imagesAndVideos.length > 4 && idx === 3 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-white text-xl font-bold">+{imagesAndVideos.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {otherFiles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {otherFiles.map((attachment) => (
                  <div key={attachment.id} className="group flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all hover:shadow-md max-w-sm">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate text-foreground/90">{getFileName(attachment.url)}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                        {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : "Attachment"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary" onClick={(e) => e.stopPropagation()}>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary" onClick={(e) => e.stopPropagation()}>
                        <a href={attachment.url} download={getFileName(attachment.url)}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions Bar - Tap to Reveal on Mobile / Hover on Desktop */}
        <div
          className={cn(
            "absolute -top-3 right-4 transition-all duration-300 transform z-10",
            isMobile
              ? (showMobileActions
                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                : "opacity-0 translate-y-2 scale-95 pointer-events-none")
              : "opacity-0 md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0"
          )}
          onClick={(e) => isMobile && e.stopPropagation()}
        >
          <div className="flex items-center gap-1 bg-background/80 backdrop-blur-md shadow-lg border border-border/40 rounded-lg p-0.5 ring-1 ring-black/5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onReply(message); }}
                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="text-[10px] font-bold py-1 px-2"
                >
                  <p>Reply</p>
                </TooltipContent>
              </Tooltip>

              {message.userId === currentUserId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Pesan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Pesan akan dihapus untuk semua orang.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] font-bold py-1 px-2"
                  >
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>
      </div>

      <ImageLightbox
        images={imagesAndVideos as any}
        initialIndex={initialImageIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}
