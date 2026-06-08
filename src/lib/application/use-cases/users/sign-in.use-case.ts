import { AuthenticationService } from "@/lib/infrastructure/services/authentication.service";
import { IUserRepository } from "../../repositories/user.repository.interface";
import { IPasswordService } from "../../services/password.service.interface";
import { IKeyService } from "../../services/key.service.interface";
import { AuthenticationError } from "@/lib/entities/errors/common";

export class SignInUseCase {
    constructor(
        private userRepository: IUserRepository,
        private authenticationService: AuthenticationService,
        private passwordService: IPasswordService,
        private keyService: IKeyService
    ) { }

    async execute(username: string, password: string, context?: { ip?: string; userAgent?: string }): Promise<string> {

        const findUser = await this.userRepository.findByUsername(username)

        if (!findUser) {
            throw new AuthenticationError("Username not found!")
        }

        const validatePassword = await this.passwordService.comparePassword(
            password,
            findUser.password
        )

        if (!validatePassword) {
            // Log failed login attempt
            await this.authenticationService.logEvent({
                userId: findUser.id,
                category: "auth",
                action: "login_failed",
                metadata: { reason: "invalid_password" },
                ip: context?.ip,
                userAgent: context?.userAgent,
            });
            throw new AuthenticationError("Password didn't match!")
        }

        // Fediverse Compatibility: Ensure user has RSA keys
        if (!findUser.publicKey || !findUser.privateKey) {
            const { publicKey, privateKey } = await this.keyService.generateKeyPair();
            await this.userRepository.update(findUser.id, {
                publicKey,
                privateKey,
                updatedAt: new Date()
            });
        }

        const token = await this.authenticationService.generateSessionToken();
        await this.authenticationService.createSession(token, findUser.id)

        // Log successful login
        await this.authenticationService.logEvent({
            userId: findUser.id,
            category: "auth",
            action: "login",
            ip: context?.ip,
            userAgent: context?.userAgent,
        });

        return token;
    }
}