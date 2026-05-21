import { IUserRepository } from "../../repositories/user.repository.interface";
import { IFollowerRepository } from "../../repositories/follower.repository.interface";

export class GetProfileUseCase {
    constructor(
        private userRepository: IUserRepository,
        private followerRepository: IFollowerRepository
    ) { }

    async execute(username: string, currentUserId?: string) {
        const user = await this.userRepository.findByUsernameWithRoles(username);
        if (!user) throw new Error("User not found");

        const followerCount = await this.followerRepository.getFollowerCount(user.id);
        const followingCount = await this.followerRepository.getFollowingCount(user.id);
        const isFollowing = currentUserId ? await this.followerRepository.isFollowing(currentUserId, user.id) : false;

        return {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio,
            banner: user.banner,
            customStatus: user.customStatus,
            roles: user.roles,
            createdAt: user.createdAt,
            stats: {
                followers: followerCount,
                following: followingCount,
            },
            isFollowing,
        };
    }
}
