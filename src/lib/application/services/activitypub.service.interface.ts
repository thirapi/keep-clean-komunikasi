export interface IActivityPubService {
    createNoteActivity(userId: string, post: any): Promise<any>;
    broadcastActivity(activity: any, actorId: string): Promise<void>;
    sendAcceptActivity(localUserId: string, followActivity: any): Promise<void>;
}
