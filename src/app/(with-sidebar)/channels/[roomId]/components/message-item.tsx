// src/app/(with-sidebar)/channels/[roomId]/components/message-item.tsx
import {
  MessageRecord,
  MessageWithUserDTO,
} from "@/lib/entities/models/message.model";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CornerLeftUp, CornerUpLeft } from "lucide-react";
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
import { AvatarImage } from "@radix-ui/react-avatar";

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
}: {
  message: MessageWithUserDTO;
  onlineUserIds: string[];
  onReply: (message: MessageWithUserDTO) => void;
}) {
  const bgColor = stringToColor(message.userId);
  const isOnline = onlineUserIds.includes(message.userId);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group flex items-start gap-3 hover:bg-muted p-2 rounded-md transition-colors duration-200 ease-in-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <Avatar className="w-10 h-10 rounded-md flex items-center justify-center font-bold">
          <AvatarImage src={message.user?.avatar ?? undefined} />
          <AvatarFallback
            className="rounded-md text-white dark:text-white"
            style={{ backgroundColor: bgColor }}
          >
            {message.user?.username.charAt(0).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div
          className={`h-2.5 w-2.5 ring-[2px] ring-background rounded-full absolute bottom-0 right-0 ${
            isOnline ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"
          }`}
        ></div>
      </div>

      <div className="flex-1 min-w-0">
        {/* Username + Timestamp */}
        <div className="text-sm font-semibold text-foreground">
          <HoverCard>
            <HoverCardTrigger asChild>
              <span className="cursor-pointer">
                {message.user?.username ?? "Unknown User"}
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-64">
              <div className="flex items-center gap-2">
                <Avatar className="w-10 h-10 rounded-md flex items-center justify-center font-bold">
                  <AvatarImage
                    src={message.user?.avatar || "/placeholder.svg"}
                    alt="Current Avatar"
                  />
                  <AvatarFallback
                    className="rounded-md text-white dark:text-white"
                    style={{ backgroundColor: bgColor }}
                  >
                    {message.user?.username.charAt(0).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {message.user?.username ?? "Unknown User"}
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          <span className="text-xs text-muted-foreground ml-2">
            {new Date(message.createdAt).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
        </div>

        {/* Reply Preview */}
        {message.replyToMessage && (
          <div className="flex items-start gap-2 rounded-sm mt-1">
            <CornerLeftUp className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold">
                {message.replyToMessage.user?.username ?? "Unknown User"}
              </span>
              <span className="ml-1">
                {truncate(message.replyToMessage.content, 100)}
              </span>
            </div>
          </div>
        )}

        {/* Message Content */}
        <div
          className="
            text-sm text-foreground mt-1
            whitespace-pre-wrap
            wrap-anywhere
            min-w-0
            pr-8
            "
        >
          {message.content}
        </div>
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="attachment"
            className="rounded-md mt-2 max-w-xs"
          />
        )}

        {/* Hover Actions */}
        {isHovered && (
          <div className="absolute top-0 right-4 bg-background shadow-sm border rounded-md py-1 px-2 flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onReply(message)}
                  className="text-muted-foreground hover:text-blue-500 p-1"
                >
                  <CornerUpLeft className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Reply</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}
