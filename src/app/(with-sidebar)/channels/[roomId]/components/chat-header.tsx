"use client";

import { useEffect, useState } from "react";
import { HashIcon, Users2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings } from "lucide-react";
import { RoomRecord, RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";

interface ChatHeaderProps {
  roomData: RoomWithParticipantsDTO;
  currentUserId: string;
  onToggleMembers?: () => void;
  membersVisible: boolean;
}

export function ChatHeader({ roomData, onToggleMembers, currentUserId, membersVisible }: ChatHeaderProps) {
  const [roomName, setRoomName] = useState("Loading...");

  useEffect(() => {
    if (roomData.isDirect) {
      const otherParticipant = roomData.participants.find(
        (p) => p.id !== currentUserId
      );
      setRoomName(
        otherParticipant?.username
          ? `${roomData.name} - ${otherParticipant.username}`
          : "unknown"
      );
    } else {
      setRoomName(roomData.name);
    }
  }, [roomData, currentUserId]);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-zinc-900 rounded-t-lg shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <HashIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold">{roomName}</h2>
        </div>
      </div>
      <button
        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full"
        onClick={onToggleMembers}
      >
        <Users2 className="w-5 h-5" />
      </button>
    </div>
  );
}
