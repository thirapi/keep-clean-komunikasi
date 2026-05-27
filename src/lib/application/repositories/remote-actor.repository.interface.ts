import { RemoteActorRecord } from "@/lib/entities/models/remote-actor.model";

export interface IRemoteActorRepository {
    upsert(actor: RemoteActorRecord): Promise<void>;
    findById(id: string): Promise<RemoteActorRecord | null>;
    findByUsernameAndDomain(username: string, domain: string): Promise<RemoteActorRecord | null>;
}
