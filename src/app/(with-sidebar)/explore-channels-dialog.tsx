"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Globe, Plus, MessageSquare } from "lucide-react";
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
      <DialogContent className="sm:max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Globe className="w-6 h-6 text-emerald-500" />
            Jelajahi Channel
          </DialogTitle>
          <DialogDescription>
            Temukan channel publik yang sesuai dengan minatmu.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nama atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="flex-1 mt-4 -mr-4 pr-4">
          <div className="space-y-3 pb-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Mencari channel publik...</p>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery ? "Tidak ada channel yang cocok" : "Belum ada channel publik tersedia"}
                </p>
              </div>
            ) : (
              filteredChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="group flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/40 transition-all duration-200"
                >
                  <UserAvatar 
                    src={channel.avatar} 
                    alt={channel.name}
                    className="h-10 w-10 rounded-lg shrink-0 border"
                  />
                  <div className="space-y-1 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                       <h3 className="font-bold text-foreground">#{channel.name}</h3>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                         Publik
                      </span>
                    </div>
                    {channel.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {channel.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium pt-1">
                      <span className="flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                         {channel.participants.length} anggota
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="shrink-0 font-semibold"
                    onClick={() => handleJoin(channel.id)}
                    disabled={isJoining !== null}
                  >
                    {isJoining === channel.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Bergabung"
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
