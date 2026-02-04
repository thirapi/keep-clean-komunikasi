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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
        (p) => p.user.id !== currentUserId,
      )?.user;

      setRoomName(otherUser?.username ?? "Unknown user");
    } else {
      setRoomName(roomData.name);
    }
  }, [roomData, currentUserId]);

  useEffect(() => {
    if (roomData.isDirect) {
      const other = roomData.participants.find(
        (p) => p.user.id !== currentUserId,
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
    onlineUserIds.includes(p.user.id),
  ).length;

  const Icon = useMemo(() => (membersVisible ? X : Users), [membersVisible]);

  return (
    <div className="flex items-center justify-between border-b bg-background/60 backdrop-blur-xl sticky top-0 z-10 px-4 py-3 md:px-6">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        {/* Sidebar Trigger - Mobile only */}
        <SidebarTrigger className="md:hidden" />

        {roomData.isDirect ? (
          <>
            <Avatar className="h-8 w-8 rounded-md shrink-0 ring-1 ring-border shadow-sm">
              <AvatarImage
                src={
                  roomData.participants.find((p) => p.user.id !== currentUserId)
                    ?.user.avatar || undefined
                }
              />
              <AvatarFallback
                className="text-xs rounded-md font-bold text-white"
                style={{
                  backgroundColor: stringToColor(
                    roomData.participants.find(
                      (p) => p.user.id !== currentUserId,
                    )?.user.id ?? "",
                  ),
                }}
              >
                {roomName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm md:text-base font-bold text-foreground leading-tight truncate">
                {roomName}
              </h1>
              <div className="flex items-center gap-1.5 transition-opacity duration-300">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isOtherUserOnline
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : "bg-muted-foreground/50",
                  )}
                />
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  {isOtherUserOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <HashIcon className="flex-shrink-0 w-5 h-5 text-muted-foreground mr-1" />
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold truncate">
                {roomName}
              </h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className="gap-2 flex-shrink-0 font-medium py-0.5 px-2"
                    >
                      {onlineUserIds.length === 0 ? (
                        <>
                          <span className="animate-spin h-2 w-2 border-2 border-green-500 border-t-transparent rounded-full" />
                          <span className="hidden sm:inline text-[11px]">
                            Loading...
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                          <span className="hidden sm:inline text-[11px]">
                            {onlineCount} online
                          </span>
                        </>
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start">
                    <p className="text-xs">
                      {onlineUserIds.length === 0
                        ? "Checking online members..."
                        : `${onlineCount} online of ${roomData.participants.length} members`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
                membersVisible && "bg-accent/40",
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
