import { SignInUseCase } from "@/lib/application/use-cases/users/sign-in.use-case";
import { InputParsedError } from "@/lib/entities/errors/common";
import { SignInUserDTO } from "@/lib/entities/models/user.model";
import { SessionRepository } from "@/lib/infrastructure/repositories/session.repository";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { AuthenticationService } from "@/lib/infrastructure/services/authentication.service";
import { PasswordService } from "@/lib/infrastructure/services/password.service";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const userRepository = new UserRepository(prisma);
const sessionRepository = new SessionRepository(prisma);

const authenticationService = new AuthenticationService(
    sessionRepository,
    userRepository
);
const passwordService = new PasswordService();

const signInUseCase = new SignInUseCase(
    userRepository,
    authenticationService,
    passwordService
)

const formSchema = z.object({
    username: z.string(),
    password: z.string(),
})

export const signInController = async (userCredential: SignInUserDTO) => {
    const parsedUserCredential = formSchema.safeParse(userCredential);

    if (!parsedUserCredential.success) {
        const errorField = {
            ...parsedUserCredential.error?.flatten().fieldErrors,
        }
        throw new InputParsedError("Invalid input: ", errorField)
    }

    return await signInUseCase.execute(
        parsedUserCredential.data.username,
        parsedUserCredential.data.password
    )
}