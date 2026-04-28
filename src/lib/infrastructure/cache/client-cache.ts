// src/lib/infrastructure/cache/client-cache.ts
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";

class ClientChatCache {
  private messages = new Map<string, MessageWithUserDTO[]>();
  private rooms = new Map<string, any>();

  constructor() {
    if (typeof window !== "undefined") {
      const savedMessages = localStorage.getItem("chat_cache_messages_v1");
      const savedRooms = localStorage.getItem("chat_cache_rooms_v1");
      
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          Object.entries(parsed).forEach(([key, val]) => {
            this.messages.set(key, val as MessageWithUserDTO[]);
          });
        } catch (e) {}
      }
      if (savedRooms) {
        try {
          const parsed = JSON.parse(savedRooms);
          Object.entries(parsed).forEach(([key, val]) => {
            this.rooms.set(key, val);
          });
        } catch (e) {}
      }
    }
  }

  setMessages(roomId: string, messages: MessageWithUserDTO[]) {
    this.messages.set(roomId, messages.slice(0, 50));
    this.persistMessages();
  }

  setRoom(roomId: string, roomData: any) {
    this.rooms.set(roomId, roomData);
    this.persistRooms();
  }

  getMessages(roomId: string): MessageWithUserDTO[] | undefined {
    return this.messages.get(roomId);
  }

  getRoom(roomId: string): any | undefined {
    return this.rooms.get(roomId);
  }

  private persistMessages() {
    if (typeof window !== "undefined") {
      localStorage.setItem("chat_cache_messages_v1", JSON.stringify(Object.fromEntries(this.messages)));
    }
  }

  private persistRooms() {
    if (typeof window !== "undefined") {
      localStorage.setItem("chat_cache_rooms_v1", JSON.stringify(Object.fromEntries(this.rooms)));
    }
  }
}

export const clientChatCache = new ClientChatCache();
