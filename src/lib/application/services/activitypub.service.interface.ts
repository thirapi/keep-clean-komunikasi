export interface IActivityPubService {
    createNoteActivity(userId: string, post: any, attachments?: any[]): Promise<any>;
    broadcastActivity(activity: any, actorId: string): Promise<void>;
    sendAcceptActivity(localUserId: string, followActivity: any, inboxUrl?: string): Promise<void>;
    followRemote(localUserId: string, remoteActorUrl: string): Promise<void>;
    unfollowRemote(localUserId: string, remoteActorUrl: string): Promise<void>;
}
