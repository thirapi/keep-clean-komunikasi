import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { stringToColor } from "@/utils/background-avatar";

interface MemberListProps {
  roomData: RoomWithParticipantsDTO;
  onlineUserIds: string[];
}

export function MemberList({ roomData, onlineUserIds }: MemberListProps) {
  return (
    <aside className="w-64 border-l p-4 hidden lg:block">
      <h3 className="text-sm font-semibold text-zinc-500 mb-2">Members</h3>
      <ul className="space-y-3">
        {roomData.participants.map((participant) => (
          <li key={participant.user.id} className="flex items-center space-x-2">
            <div className="relative">
              <Avatar className="rounded-md h-10 w-10 font-bold">
                <AvatarFallback
                  className="rounded-md"
                  style={{
                    backgroundColor: stringToColor(participant.user.id),
                  }}
                >
                  {participant.user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {onlineUserIds.includes(participant.user.id) && (
                <div
                  className={`h-2.5 w-2.5 ring-[2px] ring-background rounded-full absolute bottom-0 right-0 ${
                    onlineUserIds ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></div>
              )}
            </div>
            <HoverCard>
              <HoverCardTrigger asChild>
                <span className="cursor-pointer">
                  {participant.user.username}
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="flex items-center gap-2">
                  <Avatar className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                    <AvatarFallback
                      style={{
                        backgroundColor: stringToColor(participant.user.id),
                      }}
                    >
                      {participant.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {participant.user.username}
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </li>
        ))}
      </ul>
    </aside>
  );
}
