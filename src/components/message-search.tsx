"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, X, MessageSquare, Calendar, User, Loader2, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchMessagesAction } from "@/app/(with-sidebar)/channels/[roomId]/messages.action";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { UserAvatar } from "@/components/ui/user-avatar";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MessageSearchProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roomId?: string; // Optional for global search
  onSelectMessage: (messageId: string, roomId?: string) => void;
}

export function MessageSearch({
  isOpen,
  onOpenChange,
  roomId,
  onSelectMessage,
}: MessageSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageWithUserDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchMessagesAction(searchQuery.trim(), roomId);
      if (response.status === "success" && response.data) {
        setResults(response.data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [roomId]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        handleSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleSelect = (message: MessageWithUserDTO) => {
    onSelectMessage(message.id, message.roomId);
    onOpenChange(false);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    // Escape special regex characters to prevent crashes
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-500/30 text-yellow-950 dark:text-yellow-200 rounded-sm px-0.5 font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col shadow-2xl border-border/40">
        <DialogHeader className="p-4 border-b bg-muted/20">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <span>{roomId ? "Cari di Channel" : "Pencarian Global"}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 border-b bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={roomId ? "Cari pesan di channel ini..." : "Cari pesan di semua channel..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9 h-11 bg-muted/30 focus-visible:ring-primary/30"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto bg-background/50">
          <div className="p-2">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Mencari pesan...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground px-3 py-2 flex items-center justify-between">
                  <span>Hasil Pencarian</span>
                  <span>{results.length} ditemukan</span>
                </p>
                {results.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleSelect(message)}
                    className="w-full text-left p-3 rounded-xl hover:bg-muted/80 transition-all group flex gap-3 border border-transparent hover:border-border/50 shadow-none hover:shadow-sm"
                  >
                    <UserAvatar
                      src={message.user.avatar || "/avatars/avatar1.png"}
                      alt={message.user.username}
                      className="h-9 w-9 shrink-0 rounded-md ring-1 ring-border/50 group-hover:ring-primary/30"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm font-bold truncate">
                            {message.user.username}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">
                          {format(new Date(message.createdAt), "d MMM, HH:mm", { locale: id })}
                        </span>
                      </div>
                      <p className="text-[13px] text-foreground/80 line-clamp-2 break-words leading-relaxed">
                        {highlightText((message.content || "").replace(/<@([a-zA-Z0-9_-]+)>/g, "@seseorang"), query)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 opacity-20" />
                </div>
                <div className="space-y-1 px-4">
                  <p className="text-sm font-semibold text-foreground">Tidak ada hasil ditemukan</p>
                  <p className="text-xs max-w-[250px] mx-auto">Coba kata kunci lain atau periksa ejaan Anda di {roomId ? "channel ini" : "semua channel"}.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                  <Search className="h-8 w-8 opacity-20" />
                </div>
                <div className="space-y-1 px-8">
                  <p className="text-sm font-medium">Cari riwayat pesan</p>
                  <p className="text-xs">Masukkan setidaknya 2 karakter untuk mulai mencari {roomId ? "di channel ini" : "di semua channel"}.</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

