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
        const isMatch = this.passwordService.comparePassword(data.oldPassword, user.password);
        if (!isMatch) throw new Error("Password lama salah");
    }

    const hashedPassword = this.passwordService.hashPassword(data.newPassword);
    await this.userRepository.update(userId, { password: hashedPassword });
  }
}
