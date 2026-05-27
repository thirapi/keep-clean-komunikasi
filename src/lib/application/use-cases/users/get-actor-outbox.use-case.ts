import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";

export class GetActorOutboxUseCase {
  constructor(
    private userRepository: IUserRepository,
    private postRepository: IPostRepository
  ) {}

  async execute(username: string) {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      return null;
    }

    const posts = await this.postRepository.findByUserId(user.id, undefined, "threads", 20, 0);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
    const actorId = `${baseUrl}/api/users/${user.username}`;

    const items = posts.map(post => ({
      "id": `${post.uri}/activity`,
      "type": "Create",
      "actor": actorId,
      "published": post.createdAt.toISOString(),
      "to": ["https://www.w3.org/ns/activitystreams#Public"],
      "cc": [`${actorId}/followers`],
      "object": {
        "id": post.uri,
        "type": "Note",
        "published": post.createdAt.toISOString(),
        "attributedTo": actorId,
        "content": post.content,
        "url": post.url,
        "to": ["https://www.w3.org/ns/activitystreams#Public"],
        "cc": [`${actorId}/followers`],
      }
    }));

    return {
      "@context": "https://www.w3.org/ns/activitystreams",
      "id": `${actorId}/outbox`,
      "type": "OrderedCollection",
      "totalItems": items.length,
      "orderedItems": items
    };
  }
}
