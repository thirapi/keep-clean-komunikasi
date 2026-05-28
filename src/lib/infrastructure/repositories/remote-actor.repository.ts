import { IRemoteActorRepository } from "@/lib/application/repositories/remote-actor.repository.interface";
import { RemoteActorRecord } from "@/lib/entities/models/remote-actor.model";
import { remoteActors } from "../drizzle/schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, and, sql } from "drizzle-orm";

export class RemoteActorRepository implements IRemoteActorRepository {
    constructor(private db: NodePgDatabase<any>) {}

    async upsert(actor: RemoteActorRecord): Promise<void> {
        await this.db.insert(remoteActors)
            .values(actor)
            .onConflictDoUpdate({
                target: remoteActors.id,
                set: {
                    username: actor.username,
                    domain: actor.domain,
                    name: actor.name,
                    bio: actor.bio,
                    banner: actor.banner,
                    avatar: actor.avatar,
                    inbox: actor.inbox,
                    sharedInbox: actor.sharedInbox,
                    publicKey: actor.publicKey,
                    followerCount: actor.followerCount,
                    followingCount: actor.followingCount,
                    published: actor.published,
                    updatedAt: new Date(),
                }
            });
    }

    async findById(id: string): Promise<RemoteActorRecord | null> {
        const result = await this.db.select().from(remoteActors).where(eq(remoteActors.id, id));
        return result[0] || null;
    }

    async findByUsernameAndDomain(username: string, domain: string): Promise<RemoteActorRecord | null> {
        const result = await this.db.select()
            .from(remoteActors)
            .where(and(
                eq(sql`lower(${remoteActors.username})`, username.toLowerCase()), 
                eq(sql`lower(${remoteActors.domain})`, domain.toLowerCase())
            ));
        return result[0] || null;
    }
}
