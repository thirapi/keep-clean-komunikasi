import { DeleteUserUseCase } from "@/lib/application/use-cases/users/delete-user.use-case";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { db } from "@/lib/db";

const userRepository = new UserRepository(db);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);

export const deleteUserController = async (
  actorUserId: string,
  targetUserId: string
): Promise<void> => {
  await deleteUserUseCase.execute(actorUserId, targetUserId);
};
