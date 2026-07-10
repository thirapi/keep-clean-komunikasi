import { IUserRepository } from "../../repositories/user.repository.interface";

export class GetProfileUseCase {
    constructor(
        private userRepository: IUserRepository,
    ) { }

    async execute(username: string, currentUserId?: string) {
        const decodedUsername = decodeURIComponent(username).replace(/^@/, "");

        const user = await this.userRepository.findByUsernameWithRoles(decodedUsername);
        if (!user) return null;

        return {
            id: user.id,
            username: user.username,
            displayName: user.name,
            avatar: user.avatar,
            bio: user.bio,
            banner: user.banner,
            customStatus: user.customStatus,
            roles: user.roles,
            createdAt: user.createdAt,
            isOwnProfile: currentUserId === user.id,
        };
    }
}
