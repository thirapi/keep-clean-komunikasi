export interface IActivityPubService {
    createNoteActivity(userId: string, post: any, attachments?: any[]): Promise<any>;
    createAnnounceActivity(userId: string, post: any): Promise<any>;
    broadcastActivity(activity: any, actorId: string): Promise<void>;
    sendAcceptActivity(localUserId: string, followActivity: any, inboxUrl?: string): Promise<void>;
    followRemote(localUserId: string, remoteActorUrl: string): Promise<void>;
    unfollowRemote(localUserId: string, remoteActorUrl: string): Promise<void>;
    sendLikeActivity(userId: string, targetPostUri: string, targetActorInbox: string): Promise<void>;
    sendUndoLikeActivity(userId: string, targetPostUri: string, targetActorInbox: string): Promise<void>;
    sendAnnounceActivity(userId: string, targetPostUri: string, targetActorInbox: string): Promise<void>;
    sendUndoAnnounceActivity(userId: string, targetPostUri: string, targetActorInbox: string): Promise<void>;
    sendDeleteActivity(userId: string, postUri: string): Promise<void>;
    fetchRemoteObject(url: string): Promise<any>;
    fetchRemoteObjectSigned(url: string, userId: string): Promise<any>;
    resolveRemotePost(uri: string, localUserId: string, forceRefresh?: boolean, prefetchedObject?: any, depth?: number): Promise<any | null>;
}
