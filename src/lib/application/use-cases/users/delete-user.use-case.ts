import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";

export class DeleteUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(actorUserId: string, targetUserId: string): Promise<void> {
    // 1. Verify actor is admin (this should be checked in the controller/action but good to have here too)
    // Actually, the adminGuard handles it in the page, and we'll check in the action.
    
    // 2. Prevent self-deletion if needed (optional, but safer)
    if (actorUserId === targetUserId) {
        throw new Error("Anda tidak dapat menghapus akun Anda sendiri dari panel admin.");
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new Error("User tidak ditemukan.");
    }

    await this.userRepository.delete(targetUserId);
  }
}
