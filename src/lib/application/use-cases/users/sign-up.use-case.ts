import { IUserRepository } from "../../repositories/user.repository.interface";
import { IPasswordService } from "../../services/password.service.interface";
import { AuthenticationError } from "@/lib/entities/errors/common";
import { createId } from '@paralleldrive/cuid2';

export class SignUpUseCase {
    constructor(
        private userRepository: IUserRepository,
        private passwordService: IPasswordService
    ) { }

    async execute(username: string, password: string): Promise<void> {

        let findUser = await this.userRepository.findByUsername(username)

        if (findUser) {
            throw new AuthenticationError("Username already used!")
        }

        const hashPassword = await this.passwordService.hashPassword(password)

        const id = createId();

        await this.userRepository.insert({
            id,
            username,
            password: hashPassword,
        })
    }
}