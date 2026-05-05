import { ChangePasswordUseCase } from "@/lib/application/use-cases/users/change-password.use-case";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { PasswordService } from "@/lib/infrastructure/services/password.service";
import { db } from "@/lib/db";

const userRepository = new UserRepository(db);
const passwordService = new PasswordService();
const changePasswordUseCase = new ChangePasswordUseCase(userRepository, passwordService);

export async function changePasswordController(userId: string, data: { oldPassword?: string; newPassword: string }) {
  return await changePasswordUseCase.execute(userId, data);
}
