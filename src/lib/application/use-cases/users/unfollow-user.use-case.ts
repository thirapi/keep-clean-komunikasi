import { IFollowerRepository } from "../../repositories/follower.repository.interface";

export class UnfollowUserUseCase {
    constructor(private followerRepository: IFollowerRepository) { }

    async execute(followerId: string, followingId: string) {
        return await this.followerRepository.unfollow(followerId, followingId);
    }
}
