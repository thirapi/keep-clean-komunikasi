"use client";

import { useEffect, useMemo, useState } from "react";
import { HashIcon, Users, X, Settings } from "lucide-react";
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
import { UserAvatar } from "@/components/ui/user-avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChannelSettingsDialog } from "./channel-settings-dialog";

interface ChatHeaderProps {
  roomData: RoomWithParticipantsDTO;
  currentUserId: string;
  onToggleMembers?: () => void;
  membersVisible: boolean;
  onlineUserIds: string[];
  onUpdateRoom?: (data: Partial<RoomWithParticipantsDTO>) => void;
}

export function ChatHeader({
  roomData,
  onToggleMembers,
  currentUserId,
  membersVisible,
  onlineUserIds,
  onUpdateRoom,
}: ChatHeaderProps) {
  const [roomName, setRoomName] = useState("Loading...");
  const [otherUser, setOtherUser] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isOwner = currentUserId === roomData.ownerId;

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
    <div className="flex items-center justify-between border-b bg-background/60 backdrop-blur-xl sticky top-0 z-10 px-4 py-3 md:px-6 h-16">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        {/* Sidebar Trigger - Mobile only */}
        {isMounted && (
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
        )}

        {roomData.isDirect ? (
          <>
            <UserAvatar 
              src={roomData.participants.find((p) => p.user.id !== currentUserId)?.user.avatar || "/avatars/avatar1.png"} 
              alt={roomName}
              className="h-8 w-8 rounded-md shrink-0 ring-1 ring-border shadow-sm"
            />
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
                <span className="text-[10px] text-muted-foreground font-medium">
                  {isOtherUserOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <UserAvatar 
              src={roomData.avatar} 
              alt={roomName}
              className="h-8 w-8 rounded-md shrink-0 border shadow-sm"
            />
            <div className="flex flex-col min-w-0 ml-1">
              <div className="flex items-center gap-3">
                <h2 className="text-base sm:text-lg font-semibold truncate leading-tight">
                  {roomName}
                </h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className="hidden sm:flex gap-2 flex-shrink-0 font-medium py-0.5 px-2"
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
              {roomData.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-[500px]">
                  {roomData.description}
                </p>
              )}
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

        {/* Channel Settings — only for group channels where user is owner */}
        {!roomData.isDirect && isOwner && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="transition-colors duration-200 flex-shrink-0"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pengaturan Channel</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>

      {/* Channel Settings Dialog */}
      {!roomData.isDirect && (
        <ChannelSettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          roomData={roomData}
          currentUserId={currentUserId}
          onUpdateRoom={onUpdateRoom}
        />
      )}
    </div>
  );
}
