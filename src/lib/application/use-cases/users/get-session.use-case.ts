// src/lib/application/use-cases/users/get-session.use-case.ts
import { AuthenticationService } from "@/lib/infrastructure/services/authentication.service";

export class GetUserSessionUseCase {
    constructor(private authenticationService: AuthenticationService) { }
    async execute(session_id: string, context?: { ip?: string; userAgent?: string }) {
        const session = await this.authenticationService.validateSession(
            session_id,
            context
        )

        return session;
    }
}