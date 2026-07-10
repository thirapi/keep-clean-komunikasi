import { GetUserSessionUseCase } from "@/lib/application/use-cases/users/get-session.use-case";
import { InputParsedError } from "@/lib/entities/errors/common";
import { SessionRepository } from "@/lib/infrastructure/repositories/session.repository";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { AuthenticationService } from "@/lib/infrastructure/services/authentication.service";
import { DrizzleActivityLogRepository } from "@/lib/infrastructure/repositories/activity-log.repository";
import { z } from "zod";

import { db } from "@/lib/db";

const userRepository = new UserRepository(db);
const sessionRepository = new SessionRepository(db);
const activityLogRepository = new DrizzleActivityLogRepository();

const authenticationService = new AuthenticationService(
    sessionRepository,
    userRepository,
    activityLogRepository
);

const getUserSessionUseCase = new GetUserSessionUseCase(authenticationService);

const sessionSchema = z.object({
    session_id: z.string(),
});

export const getUserSessionController = async (session_id: string, context?: { ip?: string; userAgent?: string; metadata?: Record<string, any> }) => {
    const parsedSession = sessionSchema.safeParse({session_id})

    if (!parsedSession.success) {
        const errorField = {
            ...parsedSession.error?.flatten().fieldErrors,
        }
        throw new InputParsedError("Invalid input: ", errorField)
    }

    return await getUserSessionUseCase.execute(parsedSession.data.session_id, context);
};