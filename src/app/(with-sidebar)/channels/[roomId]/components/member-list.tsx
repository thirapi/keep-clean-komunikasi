import { useState } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { Button } from "@/components/ui/button";
import { MessageSquare, Crown, UserMinus, LogOut, UserPlus } from "lucide-react";
import { createRoom, removeParticipant } from "../room.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InviteMemberDialog } from "./invite-member-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{ userId: string, isSelf: boolean } | null>(null);

  const handleKick = async (targetUserId: string) => {
    const isSelf = targetUserId === currentUserId;
    setConfirmData({ userId: targetUserId, isSelf });
    setConfirmOpen(true);
  };

  const executeAction = async () => {
    if (!confirmData) return;
    const { userId: targetUserId, isSelf } = confirmData;

    try {
      const response = await removeParticipant(roomData.id, targetUserId, currentUserId);
      if (response.status === "success") {
        toast.success(isSelf ? "Berhasil keluar dari channel" : "Berhasil mengeluarkan anggota");
        if (isSelf) {
          router.push("/channels");
          router.refresh();
        } else {
          router.refresh();
        }
      } else {
        toast.error(response.error?.message || "Gagal melakukan aksi");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setConfirmOpen(false);
    }
  };

  const [showInvite, setShowInvite] = useState(false);
  const isOwner = currentUserId === roomData.ownerId;

  return (
    <>
      <aside className="w-64 h-full border-l border-border pt-4 pb-2 px-4 hidden lg:flex flex-col bg-card/30">
        <div className="flex items-center justify-between mb-4 shrink-0 px-1">
          <h3 className="text-sm font-medium text-muted-foreground">
            Anggota — {roomData.participants.length}
          </h3>
          {isOwner && (
            <button
              onClick={() => setShowInvite(true)}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="Undang Anggota"
            >
              <UserPlus className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 pr-2 pb-4">
          <ul className="space-y-1.5 flex flex-col">
            {roomData.participants.map((participant) => {
              const isParticipantOnline = onlineUserIds.includes(participant.user.id);
              const isParticipantOwner = participant.user.id === roomData.ownerId;

              return (
                <li key={participant.user.id} className="group flex items-center gap-3 w-full p-2 -ml-2 rounded-lg hover:bg-muted/60 transition-colors">
                  <div className="relative">
                    <UserAvatar
                      src={participant.user.avatar}
                      alt={participant.user.username}
                      className="h-8 w-8 rounded-lg shadow-sm"
                    />
                    {isParticipantOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                    )}
                  </div>

                  <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0">
                        <span className={cn(
                          "text-sm font-medium truncate",
                          isParticipantOnline ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {participant.user.username}
                        </span>
                        {isParticipantOwner && (
                          <Crown className="size-3 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 p-3 shadow-xl border-border/50">
                      <div className="flex items-center gap-3 mb-4">
                        <UserAvatar
                          src={participant.user.avatar}
                          alt={participant.user.username}
                          className="h-12 w-12 rounded-xl"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-base leading-tight">
                              {participant.user.username}
                            </p>
                            {isParticipantOwner && <Crown className="size-3 text-amber-500" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            {isParticipantOwner ? "Pemilik Channel" : "Anggota"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {participant.user.id !== currentUserId && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full justify-start gap-2 h-9 text-xs font-semibold"
                            onClick={() => handleStartDM(participant.user.id)}
                          >
                            <MessageSquare className="size-3.5 text-primary" />
                            Kirim Pesan Langsung
                          </Button>
                        )}

                        {/* Kick/Leave Actions */}
                        {isOwner && participant.user.id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 h-9 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleKick(participant.user.id)}
                          >
                            <UserMinus className="size-3.5" />
                            Keluarkan dari Channel
                          </Button>
                        )}

                        {participant.user.id === currentUserId && roomData.id !== "general-channel" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 h-9 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleKick(participant.user.id)}
                          >
                            <LogOut className="size-3.5" />
                            Keluar dari Channel
                          </Button>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        roomId={roomData.id}
        roomName={roomData.name}
        currentUserId={currentUserId}
      />
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmData?.isSelf ? "Keluar dari Channel" : "Keluarkan Anggota"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmData?.isSelf
                ? "Apakah Anda yakin ingin keluar dari channel ini? Anda perlu undangan kembali jika channel ini privat."
                : "Apakah Anda yakin ingin mengeluarkan anggota ini dari channel?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
