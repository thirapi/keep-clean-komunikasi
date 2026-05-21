import { IFollowerRepository } from "../../repositories/follower.repository.interface";

export class FollowUserUseCase {
    constructor(private followerRepository: IFollowerRepository) { }

    async execute(followerId: string, followingId: string) {
        if (followerId === followingId) {
            throw new Error("Anda tidak bisa mengikuti diri sendiri");
        }

        // Logic activitypub: In the future, this would send an 'Offer' or 'Follow' activity
        return await this.followerRepository.follow(followerId, followingId);
    }
}
