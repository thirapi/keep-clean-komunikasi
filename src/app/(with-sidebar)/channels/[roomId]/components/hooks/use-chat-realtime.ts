import { useEffect } from "react";
import { pusher } from "@/lib/pusher/pusher.client";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";

export function useChatRealtime(
  roomId: string,
  setMessages: React.Dispatch<React.SetStateAction<MessageWithUserDTO[]>>,
  setOnlineUserIds: React.Dispatch<React.SetStateAction<string[]>>
) {
  useEffect(() => {
    const chatChannel = pusher.subscribe(`chat-${roomId}`);
    const presenceChannel = pusher.subscribe(`presence-chat-${roomId}`);

    chatChannel.bind("new-message", (msg: MessageWithUserDTO) => {
      setMessages((prev) => [...prev, msg]);
    });

    presenceChannel.bind("pusher:subscription_succeeded", (members: any) => {
      const ids: string[] = [];
      members.each((member: any) => ids.push(member.id));
      setOnlineUserIds(ids);
    });

    presenceChannel.bind("pusher:member_added", (member: any) => {
      setOnlineUserIds((prev) => [...prev, member.id]);
    });

    presenceChannel.bind("pusher:member_removed", (member: any) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== member.id));
    });

    return () => {
      chatChannel.unbind_all();
      chatChannel.unsubscribe();
      presenceChannel.unbind_all();
      presenceChannel.unsubscribe();
    };
  }, [roomId]);
}
