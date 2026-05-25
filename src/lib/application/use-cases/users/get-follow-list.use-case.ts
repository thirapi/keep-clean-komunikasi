import { IFollowerRepository } from "@/lib/application/repositories/follower.repository.interface";

export class GetFollowListUseCase {
    constructor(private followerRepository: IFollowerRepository) { }

    async getFollowers(userId: string) {
        return await this.followerRepository.getFollowersList(userId);
    }

    async getFollowing(userId: string) {
        return await this.followerRepository.getFollowingList(userId);
    }
}
