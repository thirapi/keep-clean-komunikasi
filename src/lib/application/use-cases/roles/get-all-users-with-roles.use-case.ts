import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";

export class GetAllUsersWithRolesUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute() {
        return await this.userRepository.getAllUsersWithRoles();
    }
}