export interface AccountFilterRecord {
    id: string;
    userId: string;
    targetUserId?: string | null;
    targetRemoteActorId?: string | null;
    type: "mute" | "reduce_intensity";
    createdAt: Date;
    updatedAt: Date;
}

export interface IAccountFilterRepository {
    upsert(filter: Partial<AccountFilterRecord>): Promise<void>;
    delete(userId: string, targetId: string, isRemote: boolean): Promise<void>;
    findByUserId(userId: string): Promise<AccountFilterRecord[]>;
    findSpecific(userId: string, targetId: string, isRemote: boolean): Promise<AccountFilterRecord | null>;
}
