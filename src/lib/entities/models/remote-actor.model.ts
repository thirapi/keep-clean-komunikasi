export interface RemoteActorRecord {
    id: string; // Actor URI
    username: string;
    domain: string;
    name?: string | null;
    bio?: string | null;
    banner?: string | null;
    avatar?: string | null;
    inbox: string;
    sharedInbox?: string | null;
    publicKey?: string | null;
    followerCount: number;
    followingCount: number;
    published?: Date | null;
    emojis?: { name: string; url: string }[] | null;
    createdAt: Date;
    updatedAt: Date;
}
