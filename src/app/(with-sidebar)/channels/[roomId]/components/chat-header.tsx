"use client";

import { useEffect, useMemo, useState } from "react";
import { HashIcon, Users, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";

interface ChatHeaderProps {
  roomData: RoomWithParticipantsDTO;
  currentUserId: string;
  onToggleMembers?: () => void;
  membersVisible: boolean;
  onlineUserIds: string[];
}

export function ChatHeader({
  roomData,
  onToggleMembers,
  currentUserId,
  membersVisible,
  onlineUserIds,
}: ChatHeaderProps) {
  const [roomName, setRoomName] = useState("Loading...");

  useEffect(() => {
    if (roomData.isDirect) {
      const otherParticipant = roomData.participants.find(
        (p) => p.user.id !== currentUserId
      );
      setRoomName(
        otherParticipant?.user.username
          ? `${roomData.name} - ${otherParticipant.user.username}`
          : "unknown"
      );
    } else {
      setRoomName(roomData.name);
    }
  }, [roomData, currentUserId]);

  const onlineCount = roomData.participants.filter((p) =>
    onlineUserIds.includes(p.user.id)
  ).length;

  const Icon = useMemo(() => (membersVisible ? X : Users), [membersVisible]);

  return (
    <div className="flex items-center justify-between border-b rounded-t-xl bg-card/50 px-3 sm:px-4 py-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <HashIcon className="flex-shrink-0" />
        <h2 className="text-base sm:text-lg font-semibold truncate">{roomName}</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1 flex-shrink-0">
                {onlineUserIds.length === 0 ? (
                  <>
                    <span className="animate-spin h-2 w-2 border-2 border-green-500 border-t-transparent rounded-full" />
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="hidden sm:inline">{onlineCount} online</span>
                  </>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {onlineUserIds.length === 0
                  ? "Checking online members..."
                  : `${onlineCount} online of ${roomData.participants.length} members`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMembers}
              className={cn(
                "transition-colors duration-200 flex-shrink-0",
                membersVisible && "bg-accent/40"
              )}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{membersVisible ? "Hide" : "Show"} member list</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
