import { useState } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { ChatTeardropText, Crown, UserMinus, SignOut, UserPlus, X } from "@phosphor-icons/react/dist/ssr";
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
import { ProfileHoverCard } from "@/components/ui/profile-hover-card";

interface MobileMemberListProps {
  roomData: RoomWithParticipantsDTO;
  onlineUserIds: string[];
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export function MobileMemberList({
  roomData,
  onlineUserIds,
  isOpen,
  onClose,
  currentUserId
}: MobileMemberListProps) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{ userId: string, isSelf: boolean } | null>(null);

  const isOwner = currentUserId === roomData.ownerId;

  const handleStartDM = async (targetUserId: string) => {
    if (targetUserId === currentUserId) return;
    const response = await createRoom(currentUserId, targetUserId);
    if (response.status === "success" && response.data) {
      onClose();
      router.push(`/channels/${response.data.id}`);
    } else {
      toast.error(response.error?.message || "Gagal membuat percakapan");
    }
  };

  const handleKick = (targetUserId: string) => {
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
          onClose();
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

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col p-0 [&>button]:hidden">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center justify-between">
              <span className="text-sm font-bold">Anggota ({roomData.participants.length})</span>
              {isOwner && (
                <Button
                  onClick={() => setShowInvite(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <UserPlus weight="duotone" className="size-4" />
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {roomData.participants.map((participant) => {
              const isParticipantOnline = onlineUserIds.includes(participant.user.id);
              const isParticipantOwner = participant.user.id === roomData.ownerId;
              const isSelf = participant.user.id === currentUserId;

              return (
                <div key={participant.user.id} className="p-3 bg-card shadow-sm rounded-xl border border-border/40 relative overflow-hidden">
                  <ProfileHoverCard
                    user={{
                      id: participant.user.id,
                      username: participant.user.username,
                      avatar: participant.user.avatar,
                      banner: participant.user.banner,
                      bio: participant.user.bio,
                      customStatus: participant.user.customStatus,
                    }}
                    isOnline={isParticipantOnline}
                    currentUserId={currentUserId}
                    onStartDM={handleStartDM}
                  >
                    <div className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <UserAvatar
                          src={participant.user.avatar}
                          alt={participant.user.username}
                          className="h-10 w-10 rounded-xl shadow-sm border-2 border-background"
                        />
                        {isParticipantOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold truncate">
                            {participant.user.name || participant.user.username} {isSelf && "(Anda)"}
                          </span>
                          {isParticipantOwner && <Crown className="size-3.5 text-amber-500 fill-amber-500" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          {isParticipantOnline ? "Sedang Aktif" : "Offline"}
                        </p>
                      </div>
                    </div>
                  </ProfileHoverCard>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <InviteMemberDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        roomId={roomData.id}
        roomName={roomData.name}
        currentUserId={currentUserId}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="w-[90vw] rounded-2xl sm:max-w-md">
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
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
