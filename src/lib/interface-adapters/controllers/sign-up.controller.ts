import { SignUpUseCase } from "@/lib/application/use-cases/users/sign-up.use-case";
import { InputParsedError } from "@/lib/entities/errors/common";
import { SignUpUserDTO } from "@/lib/entities/models/user.model";
import { RoleRepository } from "@/lib/infrastructure/repositories/role.repository";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { PasswordService } from "@/lib/infrastructure/services/password.service";
import { KeyService } from "@/lib/infrastructure/services/key.service";
import { z } from "zod";

import { db } from "@/lib/db";
import { DicebearAvatarService } from "@/lib/infrastructure/services/avatar.service";

const userRepository = new UserRepository(db);
const passwordService = new PasswordService();
const roleRepository = new RoleRepository(db);
const avatarService = new DicebearAvatarService();
const keyService = new KeyService();

const signUpUseCase = new SignUpUseCase(
    userRepository,
    passwordService,
    roleRepository,
    avatarService,
    keyService
)

export const formSchema = z
    .object({
        username: z.string().min(3).max(31),
        password: z.string().min(4).max(31),
        confirm_password: z.string().min(4).max(31),
    })
    .superRefine(({ password, confirm_password }, ctx) => {
        if (confirm_password !== password) {
            ctx.addIssue({
                code: "custom",
                message: "Passwords do not match",
                path: ["confirm_password"],
            });
        }
    });


export const signUpController = async (userCredential: SignUpUserDTO) => {
    const parsedUserCredential = formSchema.safeParse(userCredential);

    if (!parsedUserCredential.success) {
        const errorField = {
            ...parsedUserCredential.error?.flatten().fieldErrors,
        }
        throw new InputParsedError("Invalid input: ", errorField)
    }

    return await signUpUseCase.execute(
        parsedUserCredential.data.username,
        parsedUserCredential.data.password

    )
}