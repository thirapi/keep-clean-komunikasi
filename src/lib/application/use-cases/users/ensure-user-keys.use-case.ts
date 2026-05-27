import { IUserRepository } from "../../repositories/user.repository.interface";
import { IKeyService } from "../../services/key.service.interface";

export class EnsureUserKeysUseCase {
    constructor(
        private userRepository: IUserRepository,
        private keyService: IKeyService
    ) { }

    async execute(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            return;
        }

        if (user.publicKey && user.privateKey) {
            return;
        }

        const { publicKey, privateKey } = await this.keyService.generateKeyPair();

        await this.userRepository.update(userId, {
            publicKey,
            privateKey,
            updatedAt: new Date()
        });
    }
}
