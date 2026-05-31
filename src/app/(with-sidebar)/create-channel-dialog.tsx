"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-border/40">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            buat channel baru
          </DialogTitle>
          <DialogDescription className="text-sm">
            channel adalah tempat anggota berkomunikasi. gunakan nama yang mencerminkan topik obrolan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground ml-1">Nama channel</Label>
            <Input
              id="name"
              placeholder="misal: pengumuman"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              className="h-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-muted-foreground ml-1">
              hanya huruf kecil, angka, dan tanda hubung.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-xs font-medium text-muted-foreground ml-1">Deskripsi (opsional)</Label>
            <Textarea
              id="description"
              placeholder="jelaskan tentang apa channel ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="resize-none rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 min-h-[100px]"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/10">
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                {isPublic ? "channel publik" : "channel privat"}
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isPublic 
                  ? "semua orang bisa menemukan dan bergabung." 
                  : "hanya orang yang diundang yang bisa melihat."}
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isSubmitting}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isSubmitting}
            className="rounded-xl hover:bg-muted"
          >
            batal
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isSubmitting}
            className="rounded-xl shadow-none font-medium px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                memproses...
              </>
            ) : (
              "buat channel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
