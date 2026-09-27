import { IUserRepository } from "../../repositories/user.repository.interface";

export class SearchUserUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(query: string, limit?: number) {
        const localResults = await this.userRepository.searchUsers(query, limit);
        return localResults;
    }
}
