// src/app/(with-sidebar)/channels/[roomId]/components/message-list.tsx
import {
  MessageRecord,
  MessageWithUserDTO,
} from "@/lib/entities/models/message.model";
import { MessageItem } from "./message-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { DateSeparator } from "./date-separator";
import { UnreadSeparator } from "./unread-separator";
import { DateAndUnreadSeparator } from "./date-and-unread-separator";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function MessageList({
  messages,
  bottomRef,
  unreadRef,
  onlineUserIds,
  onReply,
  lastReadAt,
  userId,
  onLoadMore,
  hasMore,
  isLoadingMore,
  viewportRef,
}: {
  messages: MessageWithUserDTO[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  unreadRef: React.RefObject<HTMLDivElement | null>;
  onlineUserIds: string[];
  onReply: (message: MessageWithUserDTO) => void;
  lastReadAt: Date | null;
  userId: string;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  viewportRef?: React.RefObject<HTMLDivElement | null>;
}) {
  let lastDate: string | null = null;

  const unreadSeparatorIndex = messages.findIndex(
    (msg) =>
      lastReadAt &&
      new Date(msg.createdAt) > lastReadAt &&
      msg.userId !== userId,
  );
  return (
    <ScrollArea viewportRef={viewportRef} className="h-full w-full px-4 pt-3">
      <div className="flex flex-col space-y-4">
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
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center space-y-4 text-muted-foreground min-h-[60vh]">
            <MessageSquare className="w-20 h-20 text-gray-400 animate-bounce" />
            <div className=" bg-accent rounded-2xl p-2">
              <h2 className="text-xl font-semibold">Belum ada pesan</h2>
              <p className="text-base max-w-sm">
                Mulai percakapan pertamamu dengan mengirimkan pesan ke room ini.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const currentDate = new Date(msg.createdAt).toDateString();
            const shouldShowDate = currentDate !== lastDate;
            const isUnread =
              unreadSeparatorIndex !== -1 && index === unreadSeparatorIndex;
            const showDateSeparator = shouldShowDate && !isUnread;
            const showUnreadAndDate = shouldShowDate && isUnread;

            lastDate = currentDate;

            return (
              <div key={msg.id} ref={unreadRef}>
                {showDateSeparator && (
                  <DateSeparator date={new Date(msg.createdAt)} />
                )}

                {showUnreadAndDate && (
                  <DateAndUnreadSeparator date={new Date(msg.createdAt)} />
                )}

                {!showDateSeparator && !showUnreadAndDate && isUnread && (
                  <UnreadSeparator />
                )}

                <MessageItem
                  message={msg}
                  onlineUserIds={onlineUserIds}
                  onReply={onReply}
                  currentUserId={userId}
                />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
