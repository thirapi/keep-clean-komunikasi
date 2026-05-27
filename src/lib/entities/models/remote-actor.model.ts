export interface RemoteActorRecord {
    id: string; // Actor URI
    username: string;
    domain: string;
    name?: string | null;
    avatar?: string | null;
    inbox: string;
    sharedInbox?: string | null;
    publicKey?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
