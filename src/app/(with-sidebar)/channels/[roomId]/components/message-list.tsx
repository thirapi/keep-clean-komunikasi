// src/app/(with-sidebar)/channels/[roomId]/components/message-list.tsx
import {
  MessageRecord,
  MessageWithUserDTO,
} from "@/lib/entities/models/message.model";
import { MessageItem } from "./message-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";

export function MessageList({
  messages,
  bottomRef,
  onlineUserIds,
  onReply,
}: {
  messages: MessageWithUserDTO[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onlineUserIds: string[];
  onReply: (message: MessageWithUserDTO) => void;
}) {
  return (
    <ScrollArea className="h-full w-full px-4 pt-3">
      <div className="flex flex-col space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center space-y-4 text-muted-foreground min-h-[70vh]">
            <MessageSquare className="w-20 h-20 text-gray-400" />
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Belum ada pesan</h2>
              <p className="text-base max-w-sm">
                Mulai percakapan pertamamu dengan mengirimkan pesan ke room ini.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onlineUserIds={onlineUserIds}
              onReply={onReply}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
