import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CornerLeftUp, CornerUpLeft, MessageSquare } from "lucide-react";
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

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

function truncate(str: string, max = 100) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export function MessageItem({
  message,
  onlineUserIds,
  onReply,
  currentUserId,
}: {
  message: MessageWithUserDTO;
  onlineUserIds: string[];
  onReply: (message: MessageWithUserDTO) => void;
  currentUserId: string;
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
  const bgColor = stringToColor(message.userId);
  const isOnline = onlineUserIds.includes(message.userId);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group flex items-start gap-4 hover:bg-muted/40 px-4 py-1.5 transition-all duration-200 ease-in-out border-l-2 border-transparent hover:border-primary/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative pt-0.5">
        <Avatar className="w-9 h-9 rounded-md flex items-center justify-center font-bold ring-1 ring-border/50">
          <AvatarImage src={message.user?.avatar ?? undefined} />
          <AvatarFallback
            className="rounded-md text-white dark:text-white text-xs"
            style={{ backgroundColor: bgColor }}
          >
            {message.user?.username.charAt(0).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div
          className={`h-2.5 w-2.5 ring-2 ring-background rounded-full absolute -bottom-0.5 -right-0.5 ${
            isOnline
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              : "bg-muted-foreground/30"
          }`}
        ></div>
      </div>

      <div className="flex-1 min-w-0">
        {/* Username + Timestamp */}
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
                  <Avatar className="w-12 h-12 rounded-lg ring-2 ring-primary/20">
                    <AvatarImage
                      src={message.user?.avatar || "/placeholder.svg"}
                      alt="Avatar"
                    />
                    <AvatarFallback
                      className="rounded-md text-white font-bold"
                      style={{ backgroundColor: bgColor }}
                    >
                      {message.user?.username.charAt(0).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
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
            {new Date(message.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
        </div>

        {/* Reply Preview */}
        {message.replyToMessage && (
          <div className="flex items-center gap-2 mt-0.5 mb-1 group/reply cursor-pointer hover:bg-primary/5 p-1 rounded-sm transition-colors border-l-2 border-primary/20 pl-2">
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
        <div
          className="
            text-[13.5px] leading-relaxed text-foreground/90 mt-0.5
            whitespace-pre-wrap
            break-words
            pr-10
            "
        >
          {message.content}
        </div>
        {message.imageUrl && (
          <div className="mt-2 relative group-media overflow-hidden rounded-lg border border-border/50 max-w-sm">
            <img
              src={message.imageUrl}
              alt="attachment"
              className="w-full object-cover transition-transform duration-300 group-media:hover:scale-105"
            />
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
