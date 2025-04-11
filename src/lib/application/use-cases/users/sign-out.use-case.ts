import { AuthenticationService } from "@/lib/infrastructure/services/authentication.service";

export class SignOutUseCase {
    constructor(private authenticationService: AuthenticationService) { }
    async execute(session_id: string) {
        let session = await this.authenticationService.validateSession(
            session_id
        )
        if (!session.session) {
            throw new Error("You dont have a session");
        }

        await this.authenticationService.invalidateSession(session.session.id);
    }
}