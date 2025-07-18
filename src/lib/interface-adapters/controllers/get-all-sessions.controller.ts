import { SessionRepository } from "@/lib/infrastructure/repositories/session.repository";
import { prisma } from "@/lib/prisma";
import { GetAllSessionsUseCase } from "@/lib/application/use-cases/sessions/get-all-session.use-case";

const sessionRepository = new SessionRepository(prisma);

const getAllSessionsUseCase = new GetAllSessionsUseCase(sessionRepository);

export const getAllSessionsController = async () => {
  return await getAllSessionsUseCase.execute();
};
