import { UserRecord } from "@/lib/entities/models/user.model";
import { IUserRepository } from "../../repositories/user.repository.interface";

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}
  async execute(userId: string, user: Partial<UserRecord>): Promise<void> {
    await this.userRepository.update(userId, user);
  }
}
