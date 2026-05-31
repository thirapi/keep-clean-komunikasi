"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, MessageSquare } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPublicRooms, joinRoom } from "./channels/[roomId]/room.action";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ExploreChannelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function ExploreChannelsDialog({
  open,
  onOpenChange,
  userId,
}: ExploreChannelsDialogProps) {
  const [channels, setChannels] = useState<RoomWithParticipantsDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const router = useRouter();

  const fetchChannels = async () => {
    setIsLoading(true);
    try {
      const response = await getPublicRooms(userId);
      if (response.status === "success" && response.data) {
        setChannels(response.data);
      }
    } catch (error) {
      toast.error("Gagal mengambil daftar channel");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchChannels();
    }
  }, [open]);

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const handleJoin = async (channelId: string) => {
    setIsJoining(channelId);
    try {
      const response = await joinRoom(channelId, userId);
      if (response.status === "success") {
        toast.success("Berhasil bergabung ke channel!");
        onOpenChange(false);
        router.push(`/channels/${channelId}`);
        router.refresh();
      } else {
        toast.error(response.error?.message ?? "Gagal bergabung");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsJoining(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden flex flex-col max-h-[85vh] rounded-2xl border-border/40 p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            jelajahi channel
          </DialogTitle>
          <DialogDescription className="text-sm">
            temukan channel publik yang sesuai dengan minatmu.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="cari berdasarkan nama atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 mt-2 px-6">
          <div className="space-y-2 pb-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                <p className="text-sm font-medium">mencari channel publik...</p>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-muted/50 rounded-2xl gap-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {searchQuery ? "tidak ada channel yang cocok" : "belum ada channel publik tersedia"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 px-4">
                    coba kata kunci lain atau periksa kembali nanti.
                  </p>
                </div>
              </div>
            ) : (
              filteredChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-accent/40 transition-all duration-200"
                >
                  <UserAvatar 
                    src={channel.avatar} 
                    alt={channel.name}
                    className="h-12 w-12 rounded-xl shrink-0 border border-border/50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                       <h3 className="font-bold text-sm text-foreground truncate">#{channel.name}</h3>
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                         publik
                      </span>
                    </div>
                    {channel.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed mb-1">
                        {channel.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 font-medium">
                      <span>{channel.participants.length} anggota</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="shrink-0 font-semibold rounded-xl shadow-none px-4"
                    onClick={() => handleJoin(channel.id)}
                    disabled={isJoining !== null}
                  >
                    {isJoining === channel.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "bergabung"
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
