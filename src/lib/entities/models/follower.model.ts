export interface FollowerRecord {
    id: string;
    followerId: string;
    followingId: string;
    createdAt: Date;
}

export interface FollowerDTO extends FollowerRecord {
    follower?: {
        username: string;
        avatar: string;
    };
    following?: {
        username: string;
        avatar: string;
    };
}
