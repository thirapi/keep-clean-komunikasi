import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { stringToColor } from "@/utils/background-avatar";
import { X } from "lucide-react";

interface MobileMemberListProps {
  roomData: RoomWithParticipantsDTO;
  onlineUserIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMemberList({ 
  roomData, 
  onlineUserIds, 
  isOpen, 
  onClose 
}: MobileMemberListProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Members ({roomData.participants.length})</span>
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-3">
          {roomData.participants.map((participant) => (
            <div key={participant.user.id} className="flex items-center space-x-2 px-3">
              <div className="relative">
                <Avatar className="rounded-md h-10 w-10 font-bold">
                  <AvatarFallback
                    className="rounded-md text-white"
                    style={{
                      backgroundColor: stringToColor(participant.user.id),
                    }}
                  >
                    {participant.user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {onlineUserIds.includes(participant.user.id) && (
                  <div className="h-2.5 w-2.5 bg-green-500 ring-2 ring-background rounded-full absolute bottom-0 right-0" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {participant.user.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {onlineUserIds.includes(participant.user.id) ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
} 