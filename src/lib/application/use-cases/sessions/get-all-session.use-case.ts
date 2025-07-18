import { ISessionRepository } from "../../repositories/session.repository.interface";

export class GetAllSessionsUseCase {
  constructor(private sessionRepository: ISessionRepository) {}

  async execute() {
    return await this.sessionRepository.getAllSessions();
  }
}
