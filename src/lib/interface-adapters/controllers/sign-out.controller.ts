import { SignOutUseCase } from "@/lib/application/use-cases/users/sign-out.use-case";
import { InputParsedError } from "@/lib/entities/errors/common";
import { SessionRepository } from "@/lib/infrastructure/repositories/session.repository";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { AuthenticationService } from "@/lib/infrastructure/services/authentication.service";
import { z } from "zod";

import { db } from "@/lib/db";

const userRepository = new UserRepository(db);
const sessionRepository = new SessionRepository(db);

const authenticationService = new AuthenticationService(
    sessionRepository,
    userRepository
);

const signOutUseCase = new SignOutUseCase(authenticationService);

const sessionSchema = z.object({
    token: z.string(),
});

export const signOutController = async (token: string) => {
    const parsedSession = sessionSchema.safeParse({token})

    if (!parsedSession.success) {
        const errorField = {
            ...parsedSession.error?.flatten().fieldErrors,
        }
        throw new InputParsedError("Invalid input: ", errorField)
    }

    return await signOutUseCase.execute(parsedSession.data.token);
};