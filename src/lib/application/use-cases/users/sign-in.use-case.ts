import { AuthenticationService } from "@/lib/infrastructure/services/authentication.service";
import { IUserRepository } from "../../repositories/user.repository.interface";
import { IPasswordService } from "../../services/password.service.interface";
import { AuthenticationError } from "@/lib/entities/errors/common";

export class SignInUseCase {
    constructor(
        private userRepository: IUserRepository,
        private authenticationService: AuthenticationService,
        private passwordService: IPasswordService,
    ) { }

    async execute(username: string, password: string, context?: { ip?: string; userAgent?: string; metadata?: Record<string, any> }): Promise<string> {

        const findUser = await this.userRepository.findByUsername(username)

        if (!findUser) {
            throw new AuthenticationError("Username not found!")
        }

        const validatePassword = await this.passwordService.comparePassword(
            password,
            findUser.password
        )

        if (!validatePassword) {
            await this.authenticationService.logEvent({
                userId: findUser.id,
                category: "auth",
                action: "login_failed",
                metadata: { ...context?.metadata, reason: "invalid_password" },
                ip: context?.ip,
                userAgent: context?.userAgent,
            });
            throw new AuthenticationError("Password didn't match!")
        }

        const token = await this.authenticationService.generateSessionToken();
        await this.authenticationService.createSession(token, findUser.id)

        // Log successful login
        await this.authenticationService.logEvent({
            userId: findUser.id,
            category: "auth",
            action: "login",
            metadata: context?.metadata,
            ip: context?.ip,
            userAgent: context?.userAgent,
        });

        return token;
    }
}