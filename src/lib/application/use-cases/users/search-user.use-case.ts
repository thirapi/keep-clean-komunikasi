import { IUserRepository } from "../../repositories/user.repository.interface";

export class SearchUserUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(query: string, limit?: number) {
        return await this.userRepository.searchUsers(query, limit);
    }
}
