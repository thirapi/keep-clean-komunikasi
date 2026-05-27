import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";

export class GetActorProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(username: string) {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
    const actorId = `${baseUrl}/api/users/${user.username}`;

    return {
      "@context": [
        "https://www.w3.org/ns/activitystreams",
        "https://w3id.org/security/v1"
      ],
      "id": actorId,
      "type": "Person",
      "preferredUsername": user.username,
      "name": user.username,
      "summary": user.bio || "",
      "url": `${baseUrl}/profile/${user.username}`,
      "published": user.createdAt.toISOString(),
      "icon": {
        "type": "Image",
        "mediaType": "image/png",
        "url": user.avatar.startsWith("http") ? user.avatar : `${baseUrl}${user.avatar}`
      },
      "image": user.banner ? {
        "type": "Image",
        "mediaType": "image/png",
        "url": user.banner.startsWith("http") ? user.banner : `${baseUrl}${user.banner}`
      } : undefined,
      "manuallyApprovesFollowers": false,
      "publicKey": {
        "id": `${actorId}#main-key`,
        "owner": actorId,
        "publicKeyPem": user.publicKey || ""
      },
      "inbox": `${actorId}/inbox`,
      "outbox": `${actorId}/outbox`,
      "followers": `${actorId}/followers`,
      "following": `${actorId}/following`
    };
  }
}

