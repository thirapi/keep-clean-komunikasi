import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CornerLeftUp, CornerUpLeft, MessageSquare, FileIcon, Download, ExternalLink } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createRoom } from "../room.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

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

  const handleStartDM = async (targetUserId: string) => {
    if (targetUserId === currentUserId) return;

    const response = await createRoom(currentUserId, targetUserId);
    if (response.status === "success" && response.data) {
      router.push(`/channels/${response.data.id}`);
    } else {
      toast.error(response.error?.message || "Gagal membuat percakapan");
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
        "relative group flex items-start gap-4 px-4 transition-all duration-300 ease-in-out border-l-2 border-transparent",
        isContinuation 
          ? "pt-0" 
          : cn("pt-2 hover:bg-muted/40 first:mt-0", isAfterSeparator ? "mt-1" : "mt-4"),
        isHovered && isContinuation && "bg-muted/30",
        isHighlighted ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20 scale-[1.01] z-10" : "hover:border-primary/30"
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
        {message.imageUrl && (
          <div className="mt-2 relative group-media overflow-hidden rounded-lg border border-border/50 max-w-sm bg-muted/20">
            {isImage(message.imageUrl) ? (
              <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative cursor-zoom-in">
                <img
                  src={message.imageUrl}
                  alt="attachment"
                  className="w-full object-cover transition-transform duration-300 group-media:hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-media:hover:bg-black/10 transition-colors flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-white opacity-0 group-media:hover:opacity-100 transition-opacity drop-shadow-md" />
                </div>
              </a>
            ) : (
              <div className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getFileName(message.imageUrl)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">File Attachment</p>
                </div>
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full shrink-0">
                  <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
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
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
