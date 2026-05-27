import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";

export class GetActorProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(username: string) {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
    
    return {
      "@context": [
        "https://www.w3.org/ns/activitystreams",
        "https://w3id.org/security/v1"
      ],
      "id": `${baseUrl}/api/users/${user.username}`,
      "type": "Person",
      "preferredUsername": user.username,
      "name": user.username,
      "summary": user.bio || "",
      "url": `${baseUrl}/profile/${user.username}`,
      "icon": {
        "type": "Image",
        "mediaType": "image/png",
        "url": `${baseUrl}${user.avatar}`
      },
      "publicKey": {
        "id": `${baseUrl}/api/users/${user.username}#main-key`,
        "owner": `${baseUrl}/api/users/${user.username}`,
        "publicKeyPem": user.publicKey || ""
      },
      "inbox": `${baseUrl}/api/users/${user.username}/inbox`,
      "outbox": `${baseUrl}/api/users/${user.username}/outbox`
    };
  }
}
