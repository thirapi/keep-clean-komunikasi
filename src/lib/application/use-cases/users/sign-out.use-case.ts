import { AuthenticationService } from "@/lib/infrastructure/services/authentication.service";

export class SignOutUseCase {
    constructor(private authenticationService: AuthenticationService) { }
    async execute(session_id: string, context?: { ip?: string; userAgent?: string; metadata?: Record<string, any> }) {
        const session = await this.authenticationService.validateSession(
            session_id,
            context
        )
        if (!session.session) {
            throw new Error("You dont have a session");
        }

        const userId = session.session.userId;

        await this.authenticationService.invalidateSession(session.session.id);

        // Log successful logout
        await this.authenticationService.logEvent({
            userId: userId,
            category: "auth",
            action: "logout",
            metadata: context?.metadata,
            ip: context?.ip,
            userAgent: context?.userAgent,
        });
    }
}