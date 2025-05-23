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
      className="relative group flex items-start gap-3 hover:bg-accent/50 p-2 rounded-md transition-colors duration-200 ease-in-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <Avatar className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center text-white font-bold">
          <AvatarFallback
            className="rounded-md"
            style={{ backgroundColor: bgColor }}
          >
            {message.user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div
          className={`h-2.5 w-2.5 ring-[2px] ring-background rounded-full absolute bottom-0 right-0 ${
            isOnline ? "bg-green-500" : "bg-gray-500"
          }`}
        ></div>
      </div>
      <div>
        <div className="text-sm font-semibold text-white">
          <HoverCard>
            <HoverCardTrigger asChild>
              <span className="cursor-pointer">{message.user.username}</span>
            </HoverCardTrigger>
            <HoverCardContent className="w-64">
              <div className="flex items-center gap-2">
                <Avatar className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center text-white font-bold">
                  <AvatarFallback
                    className="rounded-md"
                    style={{ backgroundColor: bgColor }}
                  >
                    {message.user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {message.user.username}
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          <span className="text-xs text-gray-400 ml-2">
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

        {message.replyToMessage && (
          <div className="flex items-start gap-2 rounded-sm">
            <CornerLeftUp className="h-4 w-4 text-gray-500" />
            <div className="text-sm text-gray-400">
              <span className="font-semibold">
                {message.replyToMessage.user.username}
              </span>
              <span className="ml-1">
                {truncate(message.replyToMessage.content, 100)}
              </span>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-300">{message.content}</div>
        {message.imageUrl && <img src={message.imageUrl} alt="attachment" />}

        {isHovered && (
          <div className="absolute top-0 right-4 bg-background shadow-sm border rounded-md py-1 px-2 flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onReply(message)}
                  className="text-gray-400 hover:text-blue-500 p-1"
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
