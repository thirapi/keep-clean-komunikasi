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
import { useMemo } from "react";

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
  // Use useMemo to avoid recalculating on every render, and only calculate if messages are loaded.
  const unreadSeparatorIndex = useMemo(() => {
    // 1. If we have a valid ID, try to find it
    if (lastReadMessageId) {
      const lastReadIndex = messages.findIndex(msg => msg.id === lastReadMessageId);
      if (lastReadIndex !== -1) {
        // ID found: look for the first message AFTER it that isn't from the user
        for (let i = lastReadIndex + 1; i < messages.length; i++) {
          if (messages[i].userId !== userId) return i;
        }
        // If all messages after anchor are from user, no separator
        return -1;
      }
    }

    // 2. Fallback: Use lastReadAt timestamp
    // If ID is missing (deleted) or not found in current messages, trust the timestamp
    if (lastReadAt) {
      const lastReadTime = new Date(lastReadAt).getTime();
      const firstUnreadIndex = messages.findIndex(msg => 
        new Date(msg.createdAt).getTime() > lastReadTime && 
        msg.userId !== userId
      );
      return firstUnreadIndex;
    }

    return -1;
  }, [messages, lastReadMessageId, lastReadAt, userId]);

  let lastDate: string | null = null;

  return (
    <ScrollArea viewportRef={viewportRef} className="h-full w-full px-4 pt-3">
      <div className="flex flex-col">
        {hasMore && (
          <div className="flex justify-center pb-2">
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
                "Muat pesan lama"
              )}
            </Button>
          </div>
        )}
        {!hasMore && (
          <div className="flex flex-col items-start px-4 pt-8 space-y-4">
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

        {messages.map((msg, index) => {
          const currentDate = new Date(msg.createdAt).toDateString();
          const shouldShowDate = currentDate !== lastDate;
          const isUnread =
            unreadSeparatorIndex !== -1 && index === unreadSeparatorIndex;
          const showDateSeparator = shouldShowDate && !isUnread;
          const showUnreadAndDate = shouldShowDate && isUnread;

          const prevMsg = index > 0 ? messages[index - 1] : null;
          const isSameSender = prevMsg?.userId === msg.userId;
          const msgTime = new Date(msg.createdAt).getTime();
          const prevTime = prevMsg ? new Date(prevMsg.createdAt).getTime() : 0;
          const isRecent = msgTime - prevTime < 5 * 60 * 1000; // 5 minutes
          const isContinuation = isSameSender && isRecent && !shouldShowDate && !isUnread;

          lastDate = currentDate;

          return (
            <div 
              id={`message-${msg.id}`}
              key={`msg-container-${msg.id}`} 
              ref={isUnread ? unreadRef : null}
              data-message-id={msg.id}
              className="message-container"
            >
              <>
                {showDateSeparator && index > 0 && (
                  <DateSeparator date={new Date(msg.createdAt)} />
                )}

                {showUnreadAndDate && (
                  <DateAndUnreadSeparator date={new Date(msg.createdAt)} />
                )}

                {!showDateSeparator && !showUnreadAndDate && isUnread && (
                  <UnreadSeparator />
                )}
              </>

              <MessageItem
                message={msg}
                onlineUserIds={onlineUserIds}
                onReply={onReply}
                currentUserId={userId}
                isContinuation={isContinuation}
                isAfterSeparator={(showDateSeparator && index > 0) || showUnreadAndDate || (!showDateSeparator && !showUnreadAndDate && isUnread)}
                isHighlighted={msg.id === highlightedMessageId}
                onScrollToMessage={onScrollToMessage}
              />
            </div>
          );
        })}
        <div ref={bottomRef} className="h-4" />
      </div>
    </ScrollArea>
  );
}
