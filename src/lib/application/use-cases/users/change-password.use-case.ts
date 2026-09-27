import { IPasswordService } from "@/lib/application/services/password.service.interface";
import { IUserRepository } from "../../repositories/user.repository.interface";

export class ChangePasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService
  ) {}

  async execute(userId: string, data: { oldPassword?: string; newPassword: string }): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    if (data.oldPassword) {
        // Both calls must be awaited. They were not, which only type-checked
        // because the interface used to be synchronous; a Promise was compared
        // for truthiness and a Promise was written into the password column.
        const isMatch = await this.passwordService.comparePassword(data.oldPassword, user.password);
        if (!isMatch) throw new Error("Password lama salah");
    }

    const hashedPassword = await this.passwordService.hashPassword(data.newPassword);
    await this.userRepository.update(userId, { password: hashedPassword });
  }
}
