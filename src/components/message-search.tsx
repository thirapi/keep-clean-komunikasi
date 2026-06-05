"use client";

import { useState, useCallback, useEffect } from "react";
import { MagnifyingGlass, X, ChatTeardropText, CircleNotch } from "@phosphor-icons/react/dist/ssr";
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
      console.error("MagnifyingGlass error:", error);
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
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5 font-medium">
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
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col rounded-2xl border-border/40 bg-background">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            cari pesan
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="relative group">
            <MagnifyingGlass weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary/60" />
            <Input
              placeholder={roomId ? "cari pesan di channel ini..." : "cari pesan di semua channel..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                onClick={() => setQuery("")}
              >
                <X weight="duotone" className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 mt-2 px-3 pb-4">
          <div className="p-1">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <CircleNotch weight="duotone" className="h-7 w-7 animate-spin text-primary/60" />
                <p className="text-sm font-medium">mencari pesan...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">hasil pencarian</span>
                  <span className="text-[10px] text-muted-foreground/60">{results.length} ditemukan</span>
                </div>
                {results.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleSelect(message)}
                    className="w-full text-left p-3 rounded-xl hover:bg-accent/40 active:bg-accent/60 transition-all group flex gap-3 border border-transparent hover:border-border/40"
                  >
                    <UserAvatar
                      src={message.user.avatar || "/avatars/avatar1.png"}
                      alt={message.user.username}
                      className="h-10 w-10 shrink-0 border border-border/50 transition-all"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-bold truncate">
                          {message.user.username}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
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
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center">
                  <ChatTeardropText weight="duotone" className="h-8 w-8 text-muted-foreground/20" />
                </div>
                <div className="space-y-1 px-4">
                  <p className="text-sm font-semibold text-muted-foreground">tidak ada hasil ditemukan</p>
                  <p className="text-xs text-muted-foreground/50 max-w-[250px] mx-auto">coba kata kunci lain atau periksa kembali ejaan anda.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center">
                  <MagnifyingGlass weight="duotone" className="h-8 w-8 text-muted-foreground/20" />
                </div>
                <div className="space-y-1 px-8">
                  <p className="text-sm font-medium text-muted-foreground/60">cari riwayat pesan</p>
                  <p className="text-xs text-muted-foreground/40">masukkan kata kunci untuk mulai mencari.</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

