"use client";

import { useState } from "react";
import { Loader2, Hash, Lock, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createChannel } from "./channels/[roomId]/room.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function CreateChannelDialog({
  open,
  onOpenChange,
  userId,
}: CreateChannelDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Nama channel tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createChannel(name, userId, description, isPublic);

      if (response.status === "success" && response.data) {
        toast.success("Channel berhasil dibuat!");
        onOpenChange(false);
        router.push(`/channels/${response.data.id}`);
        router.refresh();
      } else {
        toast.error(response.error?.message ?? "Gagal membuat channel");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
        open={open} 
        onOpenChange={(v) => {
            if (!isSubmitting) {
                onOpenChange(v);
                if (!v) {
                    setName("");
                    setDescription("");
                    setIsPublic(false);
                }
            }
        }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            Buat Channel Baru
          </DialogTitle>
          <DialogDescription>
            Channel adalah tempat anggota berkomunikasi. Gunakan nama yang mencerminkan topik obrolan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nama Channel</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="misal: pengumuman"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="pl-9"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Hanya huruf kecil, angka, dan tanda hubung.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan tentang apa channel ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {isPublic ? <Globe className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                <Label className="text-sm font-medium">
                  {isPublic ? "Channel Publik" : "Channel Privat"}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {isPublic 
                  ? "Semua orang bisa menemukan dan bergabung." 
                  : "Hanya orang yang diundang yang bisa melihat."}
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dibuat...
              </>
            ) : (
              "Buat Channel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
