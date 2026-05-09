import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CornerLeftUp, CornerUpLeft, MessageSquare, FileIcon, Download, ExternalLink, Trash2 } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
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
    }
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

  const images = useMemo(() => {
    return (message.attachments || [])
      .filter(a => isImage(a.url))
      .map(a => ({ url: a.url, filename: getFileName(a.url) } as ImageSource));
  }, [message.attachments]);

  const otherFiles = useMemo(() => {
    return (message.attachments || []).filter(a => !isImage(a.url));
  }, [message.attachments]);

  const openLightbox = (index: number) => {
    setInitialImageIndex(index);
    setLightboxOpen(true);
  };

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
        "relative group flex items-start gap-4 px-4 transition-all duration-300 ease-in-out",
        isContinuation 
          ? "pt-0" 
          : cn("pt-2 hover:bg-muted/40 first:mt-0", isAfterSeparator ? "mt-1" : "mt-4"),
        isHovered && isContinuation && "bg-muted/30",
        isHighlighted && "bg-primary/10 ring-1 ring-primary/20 scale-[1.01] z-10"
      )}
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
              className={`h-2.5 w-2.5 ring-2 ring-background rounded-full absolute -bottom-0.5 -right-0.5 ${
                isOnline
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
        {/* Username + Timestamp */}
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

        {/* Reply Preview */}
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

        {/* Message Content */}
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

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-col gap-2 mt-2 max-w-[500px]">
            {/* Images Grid */}
            {images.length > 0 && (
              <div className={cn(
                "grid gap-1 overflow-hidden rounded-xl border border-border/50 bg-muted/20 shadow-sm",
                images.length === 1 && "grid-cols-1 max-w-sm",
                images.length === 2 && "grid-cols-2",
                images.length >= 3 && "grid-cols-2",
              )}>
                {images.slice(0, 4).map((img, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "relative group-media cursor-zoom-in overflow-hidden aspect-square sm:aspect-auto",
                      images.length === 1 ? "aspect-auto max-h-[400px]" : "aspect-[4/3]",
                      images.length === 3 && idx === 0 && "col-span-2 aspect-[2/1]",
                    )}
                    onClick={() => openLightbox(idx)}
                  >
                    <img
                      src={img.url}
                      alt={img.filename}
                      className="w-full h-full object-cover transition-transform duration-500 group-media:hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-media:hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ExternalLink className="w-8 h-8 text-white opacity-0 group-media:hover:opacity-100 transition-all scale-75 group-media:hover:scale-100 drop-shadow-lg" />
                    </div>
                    {images.length > 4 && idx === 3 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-white text-xl font-bold">+{images.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Other Files */}
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
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
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

        {/* Hover Actions Bar - Premium Blur */}
        <div
          className={cn(
            "absolute -top-3 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 z-10",
          )}
        >
          <div className="flex items-center gap-1 bg-background/80 backdrop-blur-md shadow-lg border border-border/40 rounded-lg p-0.5 ring-1 ring-black/5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onReply(message)}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isDeleting}
                      onClick={handleDelete}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
        images={images} 
        initialIndex={initialImageIndex} 
        open={lightboxOpen} 
        onOpenChange={setLightboxOpen} 
      />
    </div>
  );
}
