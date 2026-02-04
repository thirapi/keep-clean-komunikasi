import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { stringToColor } from "@/utils/background-avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { createRoom } from "../room.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface MemberListProps {
  roomData: RoomWithParticipantsDTO;
  onlineUserIds: string[];
  currentUserId: string;
}

export function MemberList({
  roomData,
  onlineUserIds,
  currentUserId,
}: MemberListProps) {
  const router = useRouter();

  const handleStartDM = async (targetUserId: string) => {
    if (targetUserId === currentUserId) return;

    const response = await createRoom(currentUserId, targetUserId);
    if (response.status === "success" && response.data) {
      router.push(`/channels/${response.data.id}`);
    } else {
      toast.error(response.error?.message || "Gagal membuat percakapan");
    }
  };

  return (
    <aside className="w-64 h-full border-l border-border p-4 hidden lg:block">
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">
        Members
      </h3>
      <ul className="space-y-3">
        {roomData.participants.map((participant) => (
          <li key={participant.user.id} className="flex items-center space-x-2">
            <div className="relative">
              <Avatar className="rounded-lg h-10 w-10 font-bold">
                <AvatarImage
                  src={participant.user.avatar || "/placeholder.svg"}
                  alt="Current Avatar"
                />
                <AvatarFallback
                  className="rounded-lg text-white"
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
            <HoverCard>
              <HoverCardTrigger asChild>
                <span className="cursor-pointer text-foreground">
                  {participant.user.username}
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="flex items-center gap-2">
                  <Avatar className="w-10 h-10 rounded-lg font-bold">
                    <AvatarImage
                      src={participant.user.avatar || "/placeholder.svg"}
                      alt="Current Avatar"
                    />
                    <AvatarFallback
                      className="text-white"
                      style={{
                        backgroundColor: stringToColor(participant.user.id),
                      }}
                    >
                      {participant.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {participant.user.username}
                    </p>
                    {participant.user.id !== currentUserId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full gap-2 h-8 text-xs"
                        onClick={() => handleStartDM(participant.user.id)}
                      >
                        <MessageSquare className="w-3 h-3" />
                        Kirim Pesan
                      </Button>
                    )}
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
