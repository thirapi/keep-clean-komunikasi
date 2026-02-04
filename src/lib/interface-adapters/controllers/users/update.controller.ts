import { UpdateUserUseCase } from "@/lib/application/use-cases/users/update.use-case";
import { UserRecord } from "@/lib/entities/models/user.model";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { db } from "@/lib/db";

const userRepository = new UserRepository(db);
const updateUserUseCase = new UpdateUserUseCase(userRepository);

export const updateUserController = async (
  userId: string,
  user: Partial<UserRecord>
): Promise<void> => {
  await updateUserUseCase.execute(userId, user);
};
