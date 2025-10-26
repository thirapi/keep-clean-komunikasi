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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { stringToColor } from "@/utils/background-avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
  const [otherUser, setOtherUser] = useState<{
    id: string;
    username: string;
  } | null>(null);

  useEffect(() => {
    if (roomData.isDirect) {
      const otherUser = roomData.participants.find(
        (p) => p.user.id !== currentUserId
      )?.user;

      setRoomName(otherUser?.username ?? "Unknown user");
    } else {
      setRoomName(roomData.name);
    }
  }, [roomData, currentUserId]);

  useEffect(() => {
    if (roomData.isDirect) {
      const other = roomData.participants.find(
        (p) => p.user.id !== currentUserId
      )?.user;
      setOtherUser(other ?? null);
      setRoomName(other?.username ?? "Unknown user");
    } else {
      setRoomName(roomData.name);
    }
  }, [roomData, currentUserId]);

  const isOtherUserOnline = otherUser
    ? onlineUserIds.includes(otherUser.id)
    : false;

  const onlineCount = roomData.participants.filter((p) =>
    onlineUserIds.includes(p.user.id)
  ).length;

  const Icon = useMemo(() => (membersVisible ? X : Users), [membersVisible]);

  return (
    <div className="flex items-center justify-between border-b bg-card/50 px-8 sm:px-4 py-3 -mx-4">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Sidebar Trigger - Mobile only */}
        <SidebarTrigger className="md:hidden" />
        
        {roomData.isDirect ? (
          <>
            <Avatar className="h-8 w-8 rounded-md">
              <AvatarFallback
                className="text-xs rounded-md"
                style={{
                  backgroundColor: stringToColor(
                    roomData.participants.find(
                      (p) => p.user.id !== currentUserId
                    )?.user.id ?? ""
                  ),
                }}
              >
                {roomName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                {roomName}
              </h1>
              <p className="text-xs text-sidebar-foreground/70 flex items-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOtherUserOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                {isOtherUserOnline ? "Online" : "Offline"}
              </p>
            </div>
          </>
        ) : (
          <>
            <HashIcon className="flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold truncate">
              {roomName}
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
                          <span className="hidden sm:inline">
                            {onlineCount} online
                          </span>
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
            </h2>
          </>
        )}
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
