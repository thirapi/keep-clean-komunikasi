import { IAvatarService } from "@/lib/application/services/avatar.service.interface";

export class DicebearAvatarService implements IAvatarService {
  /**
   * Generates a Dicebear avatar URL.
   * Using 'initials' style for a clean look, but can be switched to 'bottts', 'identicon', etc.
   */
  generateAvatarUrl(seed: string): string {
    const encodedSeed = encodeURIComponent(seed);
    // Using initials style with some nice defaults
    return `https://api.dicebear.com/9.x/initials/svg?seed=${encodedSeed}&backgroundColor=00897b,00acc1,039be5,1e88e5,3949ab,5e35b1,8e24aa,d81b60,e53935,fb8c00,fdd835,7cb342,43a047,757575,546e7a`;
  }
}

// Export singleton instance for easy usage in controllers and UI
export const avatarService = new DicebearAvatarService();
