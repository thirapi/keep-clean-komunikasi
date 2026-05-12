// src/app/(with-sidebar)/channels/[roomId]/components/message-list.tsx
import {
  MessageRecord,
  MessageWithUserDTO,
} from "@/lib/entities/models/message.model";
import { MessageItem } from "./message-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Hash, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { DateSeparator } from "./date-separator";
import { UnreadSeparator } from "./unread-separator";
import { DateAndUnreadSeparator } from "./date-and-unread-separator";
import { Button } from "@/components/ui/button";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { useMemo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function MessageList({
  messages,
  bottomRef,
  unreadRef,
  onlineUserIds,
  onReply,
  lastReadMessageId,
  lastReadAt,
  userId,
  onLoadMore,
  hasMore,
  isLoadingMore,
  viewportRef,
  roomData,
  highlightedMessageId,
  onScrollToMessage,
}: {
  messages: MessageWithUserDTO[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  unreadRef: React.RefObject<HTMLDivElement | null>;
  onlineUserIds: string[];
  onReply: (message: MessageWithUserDTO) => void;
  lastReadMessageId: string | null;
  lastReadAt: Date | null;
  userId: string;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  viewportRef?: React.RefObject<HTMLDivElement | null>;
  roomData: RoomWithParticipantsDTO;
  highlightedMessageId?: string | null;
  onScrollToMessage?: (messageId: string) => void;
}) {
  // --- UNREAD SEPARATOR LOGIC ---
  // We want the separator to stay at its INITIAL position when the user entered.
  // It should not "jump" or "descend" as messages are marked as read.
  const [initialUnreadId, setInitialUnreadId] = useState<string | null>(null);
  const [isUnreadCleared, setIsUnreadCleared] = useState(false);

  // Initialize the initial unread marker ONLY once on mount or when messages first load
  useEffect(() => {
    if (initialUnreadId || messages.length === 0) return;

    let firstUnreadIdx = -1;
    if (lastReadMessageId) {
      const lastReadIndex = messages.findIndex(msg => msg.id === lastReadMessageId);
      if (lastReadIndex !== -1) {
        for (let i = lastReadIndex + 1; i < messages.length; i++) {
          if (messages[i].userId !== userId) {
            firstUnreadIdx = i;
            break;
          }
        }
      }
    } else if (lastReadAt) {
      const lastReadTime = new Date(lastReadAt).getTime();
      firstUnreadIdx = messages.findIndex(msg =>
        new Date(msg.createdAt).getTime() > lastReadTime &&
        msg.userId !== userId
      );
    }

    if (firstUnreadIdx !== -1) {
      setInitialUnreadId(messages[firstUnreadIdx].id);
    }
  }, [messages, lastReadMessageId, lastReadAt, userId, initialUnreadId]);

  // Monitor if the unread state has been cleared (lastReadAt is newer than our initial unread message)
  useEffect(() => {
    if (!initialUnreadId || isUnreadCleared) return;

    const unreadMsg = messages.find(m => m.id === initialUnreadId);
    if (!unreadMsg) return;

    const unreadTime = new Date(unreadMsg.createdAt).getTime();
    const currentReadTime = lastReadAt ? new Date(lastReadAt).getTime() : 0;

    // If we have now read past the initial unread message OR the ID itself is now the lastReadId
    if (currentReadTime >= unreadTime || lastReadMessageId === initialUnreadId) {
      // Small delay for UX so user sees the line for a split second before it fades
      const timer = setTimeout(() => setIsUnreadCleared(true), 300);
      return () => clearTimeout(timer);
    }
  }, [messages, lastReadAt, lastReadMessageId, initialUnreadId, isUnreadCleared]);

  let lastDate: string | null = null;

  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { root: viewportRef?.current, threshold: 0.1 }
    );
    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasMore, isLoadingMore, onLoadMore, viewportRef]);

  // We compute the chronologically arranged nodes first so prevMsg logic remains identically sound.
  const nodes: React.ReactNode[] = [];

  messages.forEach((msg, index) => {
    const currentDate = new Date(msg.createdAt).toDateString();
    const shouldShowDate = currentDate !== lastDate;
    const isInitialUnread = initialUnreadId === msg.id && !isUnreadCleared;
    
    const showDateSeparator = shouldShowDate && !isInitialUnread;
    const showUnreadAndDate = shouldShowDate && isInitialUnread;

    const prevMsg = index > 0 ? messages[index - 1] : null;
    const isSameSender = prevMsg?.userId === msg.userId;
    const msgTime = new Date(msg.createdAt).getTime();
    const prevTime = prevMsg ? new Date(prevMsg.createdAt).getTime() : 0;
    const isRecent = msgTime - prevTime < 5 * 60 * 1000; // 5 minutes
    const isContinuation = isSameSender && isRecent && !shouldShowDate && !isInitialUnread;

    lastDate = currentDate;

    nodes.push(
      <div
        id={`message-${msg.id}`}
        key={`msg-container-${msg.id}`}
        ref={isInitialUnread ? unreadRef : null}
        data-message-id={msg.id}
        className="message-container"
      >
        <AnimatePresence mode="popLayout">
          {showDateSeparator && index > 0 && (
            <motion.div
              key={`date-${msg.id}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <DateSeparator date={new Date(msg.createdAt)} />
            </motion.div>
          )}

          {showUnreadAndDate && (
            <motion.div
              key={`unread-date-${msg.id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.4 } }}
              className="overflow-hidden"
            >
              <DateAndUnreadSeparator date={new Date(msg.createdAt)} />
            </motion.div>
          )}

          {!showDateSeparator && !showUnreadAndDate && isInitialUnread && (
            <motion.div
              key={`unread-${msg.id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.4 } }}
              className="overflow-hidden"
            >
              <UnreadSeparator />
            </motion.div>
          )}
        </AnimatePresence>

        <MessageItem
          message={msg}
          onlineUserIds={onlineUserIds}
          onReply={onReply}
          currentUserId={userId}
          isContinuation={isContinuation}
          isAfterSeparator={(showDateSeparator && index > 0) || showUnreadAndDate || (!showDateSeparator && !showUnreadAndDate && isInitialUnread)}
          isHighlighted={msg.id === highlightedMessageId}
          onScrollToMessage={onScrollToMessage}
        />
      </div>
    );
  });

  return (
    <div
      ref={viewportRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden flex flex-col-reverse px-4 pt-3 scrollbar-thin overflow-anchor-auto"
    >
      <div ref={bottomRef} className="h-4 shrink-0" />
      {nodes.reverse()}

      {/* Header and Load More button are at the very end of the flex-col-reverse -> visual top */}
      {!hasMore && (
        <div className="flex flex-col items-start px-4 pt-8 pb-4 space-y-4 shrink-0">
          <UserAvatar
            src={roomData.isDirect
              ? (roomData.participants.find((p: any) => p.user.id !== userId)?.user.avatar || "/avatars/avatar1.png")
              : (roomData.avatar || "/avatars/avatar6.png")
            }
            alt={roomData.isDirect
              ? roomData.participants.find((p: any) => p.user.id !== userId)?.user.username
              : roomData.name
            }
            className="h-16 w-16 rounded-2xl shadow-sm border-2 border-background"
          />
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome to #{roomData.isDirect ? (roomData.participants.find((p: any) => p.user.id !== userId)?.user.username) : roomData.name}!
            </h1>
            <p className="text-muted-foreground">
              This is the start of the #{roomData.isDirect ? (roomData.participants.find((p: any) => p.user.id !== userId)?.user.username) : roomData.name} channel.
            </p>
          </div>
          {messages.length > 0 && (
            <div className="w-full">
              <DateSeparator date={new Date(messages[0].createdAt)} />
            </div>
          )}
          {messages.length === 0 && (
            <div className="w-full pt-4 opacity-50 italic text-[11px]">
              Belum ada pesan di sini. Jadilah yang pertama!
            </div>
          )}
        </div>
      )}

      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4 shrink-0 mt-4 h-16">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Memuat...
              </>
            ) : (
              "Memuat pesan lama..."
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
