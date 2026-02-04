import { SessionRepository } from "@/lib/infrastructure/repositories/session.repository";
import { db } from "@/lib/db";
import { GetAllSessionsUseCase } from "@/lib/application/use-cases/sessions/get-all-session.use-case";

const sessionRepository = new SessionRepository(db);

const getAllSessionsUseCase = new GetAllSessionsUseCase(sessionRepository);

export const getAllSessionsController = async () => {
  return await getAllSessionsUseCase.execute();
};
