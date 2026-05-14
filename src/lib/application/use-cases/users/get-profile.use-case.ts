import { IUserRepository } from "../../repositories/user.repository.interface";

export class GetProfileUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(username: string) {
        const user = await this.userRepository.findByUsernameWithRoles(username);
        if (!user) throw new Error("User not found");

        // Omit sensitive data if any (though findByUsernameWithRoles already filters roles/info)
        return {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio,
            banner: user.banner,
            customStatus: user.customStatus,
            roles: user.roles,
            createdAt: user.createdAt,
        };
    }
}
