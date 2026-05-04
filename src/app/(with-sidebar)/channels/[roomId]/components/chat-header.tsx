"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Info } from "lucide-react";
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
import { RoomDetailDialog } from "./room-detail-dialog";

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
  const [showDetails, setShowDetails] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const otherUser = useMemo(() => {
    if (!roomData.isDirect) return null;
    return roomData.participants.find((p) => p.user.id !== currentUserId)?.user ?? null;
  }, [roomData, currentUserId]);

  const roomName = useMemo(() => {
    if (roomData.isDirect) {
      return otherUser?.username ?? "Unknown user";
    }
    return roomData.name;
  }, [roomData, otherUser]);

  const isOtherUserOnline = useMemo(() => {
    return otherUser ? onlineUserIds.includes(otherUser.id) : false;
  }, [otherUser, onlineUserIds]);

  const onlineCount = useMemo(() => {
    return roomData.participants.filter((p) =>
      onlineUserIds.includes(p.user.id),
    ).length;
  }, [roomData.participants, onlineUserIds]);

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
            <div 
              className="cursor-pointer transition-transform active:scale-95" 
              onClick={() => setShowDetails(true)}
            >
              <UserAvatar
                src={otherUser?.avatar || "/avatars/avatar1.png"}
                alt={roomName}
                className="h-8 w-8 rounded-md shrink-0 ring-1 ring-border shadow-sm"
              />
            </div>
            <div 
              className="flex flex-col min-w-0 cursor-pointer group"
              onClick={() => setShowDetails(true)}
            >
              <h1 className="text-sm md:text-base font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
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
            <div 
              className="cursor-pointer transition-transform active:scale-95" 
              onClick={() => setShowDetails(true)}
            >
              <UserAvatar
                src={roomData.avatar}
                alt={roomName}
                className="h-8 w-8 rounded-md shrink-0 border shadow-sm"
              />
            </div>
            <div className="flex flex-col min-w-0 ml-1">
              <div className="flex items-center gap-3">
                <h2 
                  className="text-base sm:text-lg font-semibold truncate leading-tight cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setShowDetails(true)}
                >
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
      <div className="flex items-center gap-1 sm:gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetails(true)}
                className="transition-colors duration-200 flex-shrink-0"
              >
                <Info className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{roomData.isDirect ? "Profil Pengguna" : "Informasi Channel"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMembers}
                className={cn(
                  "transition-colors duration-200 flex-shrink-0",
                  membersVisible && "bg-accent text-accent-foreground",
                )}
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{membersVisible ? "Hide" : "Show"} member list</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Room Detail Dialog */}
      <RoomDetailDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        roomData={roomData}
        currentUserId={currentUserId}
        onUpdateRoom={onUpdateRoom}
      />
    </div>
  );
}
