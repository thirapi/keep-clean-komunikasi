// src/lib/infrastructure/cache/client-cache.ts
import Dexie, { type EntityTable } from 'dexie';
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";

export interface RoomMetadata {
  roomId: string;
  roomData: any;
  lastReadId: string | null;
  lastReadAt: string | null;
}

export class KomunikasiDB extends Dexie {
  messages!: EntityTable<MessageWithUserDTO, 'id'>;
  roomMetadata!: EntityTable<RoomMetadata, 'roomId'>;

  constructor() {
    super('KomunikasiClientDB');
    this.version(1).stores({
      messages: 'id, roomId, createdAt',
      roomMetadata: 'roomId'
    });
  }
}

export const db = new KomunikasiDB();

class ClientChatCache {
  private memMessages = new Map<string, MessageWithUserDTO[]>();
  private memRooms = new Map<string, any>();
  private memLastRead = new Map<string, { id: string | null; at: Date | null }>();

  constructor() { }

  getMessagesSync(roomId: string) { return this.memMessages.get(roomId); }
  getRoomSync(roomId: string) { return this.memRooms.get(roomId); }
  getLastReadSync(roomId: string) { return this.memLastRead.get(roomId) || { id: null, at: null }; }

  async setMessages(roomId: string, messages: MessageWithUserDTO[]) {
    if (typeof window === "undefined" || !messages || messages.length === 0) return;
    try {
      const limited = messages.slice(-50);
      this.memMessages.set(roomId, limited);
      await db.messages.bulkPut(limited); // Will update existing, insert new
    } catch (e) {
      console.warn("Failed to set messages in IndexedDB", e);
    }
  }

  async mergeMessages(roomId: string, newMessages: MessageWithUserDTO[]) {
    if (typeof window === "undefined" || !newMessages || newMessages.length === 0) return;
    try {
      // Just put them, since Dexie stores the source of truth individually per id
      await db.messages.bulkPut(newMessages);

      // Now enforce the 50 limit by querying locally
      const allMsgs = await db.messages
        .where('roomId')
        .equals(roomId)
        .sortBy('createdAt');

      let limited = allMsgs;
      if (allMsgs.length > 50) {
        limited = allMsgs.slice(allMsgs.length - 50);
        const toDelete = allMsgs.slice(0, allMsgs.length - 50);
        const keysToDelete = toDelete.map(m => m.id);
        await db.messages.bulkDelete(keysToDelete);
      }
      this.memMessages.set(roomId, limited);
    } catch (e) {
      console.warn("Failed to merge messages in IndexedDB", e);
    }
  }

  async removeMessage(roomId: string, messageId: string) {
    if (typeof window === "undefined") return;
    try {
      await db.messages.delete(messageId);
      const cached = this.memMessages.get(roomId);
      if (cached) {
        this.memMessages.set(roomId, cached.filter(m => m.id !== messageId));
      }
    } catch (e) {
      console.warn("Failed to remove message in IndexedDB", e);
    }
  }

  async setRoom(roomId: string, roomData: any) {
    if (typeof window === "undefined") return;
    try {
      this.memRooms.set(roomId, roomData);
      const existing = await db.roomMetadata.get(roomId);
      await db.roomMetadata.put({
        roomId,
        roomData,
        lastReadId: existing?.lastReadId ?? null,
        lastReadAt: existing?.lastReadAt ?? null
      });
    } catch (e) {
      console.warn("Failed to set room in IndexedDB", e);
    }
  }

  async setLastRead(roomId: string, messageId: string | null, lastReadAt?: Date | null) {
    if (typeof window === "undefined") return;
    try {
      this.memLastRead.set(roomId, { id: messageId, at: lastReadAt || null });
      const existing = await db.roomMetadata.get(roomId);
      await db.roomMetadata.put({
        roomId,
        roomData: existing?.roomData ?? null,
        lastReadId: messageId,
        lastReadAt: lastReadAt ? lastReadAt.toISOString() : (existing?.lastReadAt ?? null)
      });
    } catch (e) {
      console.warn("Failed to set last read in IndexedDB", e);
    }
  }

  async getMessages(roomId: string): Promise<MessageWithUserDTO[] | undefined> {
    if (typeof window === "undefined") return undefined;
    if (this.memMessages.has(roomId)) return this.memMessages.get(roomId);
    try {
      const msgs = await db.messages.where('roomId').equals(roomId).sortBy('createdAt');
      if (msgs.length > 0) {
        this.memMessages.set(roomId, msgs);
        return msgs;
      }
      return undefined;
    } catch (e) {
      console.warn("Failed to get messages from IndexedDB", e);
      return undefined;
    }
  }

  async getRoom(roomId: string): Promise<any | undefined> {
    if (typeof window === "undefined") return undefined;
    if (this.memRooms.has(roomId)) return this.memRooms.get(roomId);
    try {
      const meta = await db.roomMetadata.get(roomId);
      if (meta?.roomData) {
        this.memRooms.set(roomId, meta.roomData);
        return meta.roomData;
      }
      return undefined;
    } catch (e) {
      console.warn("Failed to get room from IndexedDB", e);
      return undefined;
    }
  }

  async getLastRead(roomId: string): Promise<{ id: string | null; at: Date | null }> {
    if (typeof window === "undefined") return { id: null, at: null };
    if (this.memLastRead.has(roomId)) return this.memLastRead.get(roomId)!;
    try {
      const meta = await db.roomMetadata.get(roomId);
      const res = {
        id: meta?.lastReadId || null,
        at: meta?.lastReadAt ? new Date(meta.lastReadAt) : null,
      };
      this.memLastRead.set(roomId, res);
      return res;
    } catch (e) {
      console.warn("Failed to get last read from IndexedDB", e);
      return { id: null, at: null };
    }
  }

  async invalidate(roomId: string) {
    if (typeof window === "undefined") return;
    try {
      this.memMessages.delete(roomId);
      this.memRooms.delete(roomId);
      this.memLastRead.delete(roomId);
      await db.messages.where('roomId').equals(roomId).delete();
      await db.roomMetadata.delete(roomId);
    } catch (e) {
      console.warn("Failed to invalidate IndexedDB for room", e);
    }
  }
}

export const clientChatCache = new ClientChatCache();
