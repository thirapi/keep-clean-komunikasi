import { db } from "@/lib/db";
import { posts, postReactions, attachments as attachmentsTable, followers } from "@/lib/infrastructure/drizzle/schema";
import { eq, desc, asc, and, isNotNull, isNull, exists, sql, or, inArray, notInArray } from "drizzle-orm";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { PostRecord, PostWithUserDTO } from "@/lib/entities/models/post.model";
import { createId } from "@paralleldrive/cuid2";

export class PostRepository implements IPostRepository {
    constructor(private client: typeof db) { }

    async create(post: PostRecord, attachments?: { url: string; key: string; fileType: string; size?: number; blurhash?: string; description?: string }[]): Promise<PostRecord> {
        return await this.client.transaction(async (tx) => {
            const [result] = await tx.insert(posts).values({
                ...post,
            }).returning();

            if (attachments && attachments.length > 0) {
                await tx.insert(attachmentsTable).values(
                    attachments.map((a) => ({
                        id: createId(),
                        postId: post.id,
                        url: a.url,
                        key: a.key,
                        fileType: a.fileType,
                        size: a.size,
                        blurhash: a.blurhash,
                        description: a.description
                    }))
                );
            }

            return result as unknown as PostRecord;
        });
    }

    async update(id: string, post: Partial<PostRecord>, attachments?: { url: string; key: string; fileType: string; size?: number; blurhash?: string; description?: string }[]): Promise<PostRecord> {
        return await this.client.transaction(async (tx) => {
            const [result] = await tx
                .update(posts)
                .set({ ...post, updatedAt: new Date() })
                .where(eq(posts.id, id))
                .returning();

            if (attachments && attachments.length > 0) {
                // For updates, we often just want to add attachments if they were missing
                // To avoid duplicates, we check if they exist or just try to insert with conflict handling
                const existing = await tx.select().from(attachmentsTable).where(eq(attachmentsTable.postId, id));
                const existingUrls = new Set(existing.map(e => e.url));

                const newAttachments = attachments.filter(a => !existingUrls.has(a.url));

                if (newAttachments.length > 0) {
                    await tx.insert(attachmentsTable).values(
                        newAttachments.map((a) => ({
                            id: createId(),
                            postId: id,
                            url: a.url,
                            key: a.key,
                            fileType: a.fileType,
                            size: a.size,
                            blurhash: a.blurhash,
                            description: a.description
                        }))
                    );
                }
            }

            return result as unknown as PostRecord;
        });
    }

    async delete(id: string): Promise<void> {
        await this.client.update(posts).set({ isDeleted: true }).where(eq(posts.id, id));
    }

    async findById(id: string, includeDeleted = false): Promise<PostRecord | null> {
        const [result] = await this.client.select().from(posts).where(
            and(
                eq(posts.id, id),
                includeDeleted ? undefined : eq(posts.isDeleted, false)
            )
        );
        return (result as unknown as PostRecord) || null;
    }

    async findByUri(uri: string, includeDeleted = false): Promise<PostRecord | null> {
        const [result] = await this.client.select().from(posts).where(
            and(
                eq(posts.uri, uri),
                includeDeleted ? undefined : eq(posts.isDeleted, false)
            )
        );
        return (result as unknown as PostRecord) || null;
    }

    async deleteByUri(uri: string): Promise<void> {
        await this.client.update(posts).set({ isDeleted: true }).where(eq(posts.uri, uri));
    }

    async findByContext(context: string, currentUserId?: string): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: and(eq(posts.context, context), eq(posts.isDeleted, false)),
            orderBy: [asc(posts.createdAt)],
            with: {
                user: {
                    columns: { username: true, name: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                remoteActor: true,
                attachments: true,
                reactions: {
                    with: { user: { columns: { username: true } }, remoteActor: true },
                },
                replyTo: {
                    with: { 
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } }, 
                        remoteActor: true, 
                        bookmarks: true 
                    },
                },
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                quoteOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                reposts: {
                    where: eq(posts.isDeleted, false),
                    columns: { id: true, userId: true }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                bookmarks: true,
                linkPreviews: true,
            },
        });
        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async findRepost(userId: string, originalPostId: string): Promise<PostRecord | null> {
        const result = await this.client.query.posts.findFirst({
            where: and(
                eq(posts.userId, userId),
                eq(posts.repostOfId, originalPostId),
                eq(posts.isDeleted, false),
                eq(posts.content, "")
            )
        });
        return (result as unknown as PostRecord) || null;
    }

    async findByIdWithDetails(id: string, currentUserId?: string): Promise<PostWithUserDTO | null> {
        const result = await this.client.query.posts.findFirst({
            where: and(eq(posts.id, id), eq(posts.isDeleted, false)),
            with: {
                user: {
                    columns: { username: true, name: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                remoteActor: true,
                attachments: true,
                reactions: {
                    with: { user: { columns: { username: true } }, remoteActor: true },
                },
                replyTo: {
                    with: { 
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } }, 
                        remoteActor: true, 
                        bookmarks: true 
                    },
                },
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                quoteOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                reposts: { 
                    where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                bookmarks: true,
                linkPreviews: true,
            },
        });

        if (!result) return null;

        const results = await this.mapPostsWithStates([result] as any, currentUserId);
        const dto = results[0];
        dto.isDeleted = result.isDeleted;

        return dto;
    }

    async findByUserId(userId: string, currentUserId?: string, filter?: "threads" | "replies" | "reposts" | "media", limit = 20, offset = 0): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: (posts, { and, eq, isNotNull, isNull, or }) => {
                const isOwner = currentUserId === userId;
                const base = and(
                    eq(posts.userId, userId), 
                    eq(posts.isDeleted, false),
                    or(
                        eq(posts.visibility, "public"),
                        isOwner ? undefined : eq(posts.visibility, "unlisted"),
                        isOwner ? eq(posts.visibility, "private") : undefined,
                        isOwner ? eq(posts.visibility, "unlisted") : undefined
                    )
                );
                if (filter === "threads") return and(base, isNull(posts.replyToId));
                if (filter === "replies") return and(base, isNotNull(posts.replyToId));
                if (filter === "reposts") return and(base, isNotNull(posts.repostOfId), eq(posts.content, ""));
                if (filter === "media") return and(base, exists(
                    this.client.select().from(attachmentsTable).where(eq(attachmentsTable.postId, posts.id))
                ));
                return base;
            },
            orderBy: [desc(posts.createdAt)],
            limit,
            offset,
            with: {
                user: {
                    columns: { username: true, name: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                remoteActor: true,
                attachments: true,
                reactions: {
                    with: { user: { columns: { username: true } }, remoteActor: true },
                },
                replyTo: {
                    with: { 
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } }, 
                        remoteActor: true, 
                        bookmarks: true 
                    },
                },
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                quoteOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                reposts: { 
                    where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                bookmarks: true,
                linkPreviews: true,
            },
        });

        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async findByRemoteActorId(remoteActorId: string | string[], currentUserId?: string, filter?: "threads" | "replies" | "reposts" | "media", limit = 20, offset = 0): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: (posts, { and, eq, isNotNull, isNull, exists, or, inArray }) => {
                const base = and(
                    Array.isArray(remoteActorId) ? inArray(posts.remoteActorId, remoteActorId) : eq(posts.remoteActorId, remoteActorId), 
                    eq(posts.isDeleted, false),
                    or(
                        eq(posts.visibility, "public"),
                        eq(posts.visibility, "unlisted")
                    )
                );
                if (filter === "threads") return and(base, isNull(posts.replyToId));
                if (filter === "replies") return and(base, isNotNull(posts.replyToId));
                if (filter === "reposts") return and(base, isNotNull(posts.repostOfId), eq(posts.content, ""));
                if (filter === "media") return and(base, exists(
                    this.client.select().from(attachmentsTable).where(eq(attachmentsTable.postId, posts.id))
                ));
                return base;
            },
            orderBy: [desc(posts.createdAt)],
            limit,
            offset,
            with: {
                user: {
                    columns: { username: true, name: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                remoteActor: true,
                attachments: true,
                reactions: {
                    with: { user: { columns: { username: true } }, remoteActor: true },
                },
                replyTo: {
                    with: { 
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } }, 
                        remoteActor: true, 
                        bookmarks: true 
                    },
                },
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                quoteOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                reposts: { 
                    where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                bookmarks: true,
                linkPreviews: true,
            },
        });

        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async findReplies(postId: string, currentUserId?: string): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: and(eq(posts.replyToId, postId), eq(posts.isDeleted, false)),
            orderBy: [desc(posts.createdAt)],
            with: {
                user: {
                    columns: { username: true, name: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                remoteActor: true,
                attachments: true,
                reactions: {
                    with: { user: { columns: { username: true } }, remoteActor: true },
                },
                bookmarks: true,
                linkPreviews: true,
            }
        });
        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async countByUserId(userId: string, filter?: "threads" | "replies" | "reposts" | "media"): Promise<number> {
        const result = await this.client
            .select({ count: sql<number>`count(*)` })
            .from(posts)
            .where(and(
                eq(posts.userId, userId),
                eq(posts.isDeleted, false),
                ...filter === "threads" ? [isNull(posts.replyToId)] : [],
                ...filter === "replies" ? [isNotNull(posts.replyToId)] : [],
                ...filter === "reposts" ? [isNotNull(posts.repostOfId), eq(posts.content, "")] : [],
                ...filter === "media" ? [exists(this.client.select().from(attachmentsTable).where(eq(attachmentsTable.postId, posts.id)))] : []
            ));
        return Number(result[0].count);
    }

    async countByRemoteActorId(remoteActorId: string | string[], filter?: "threads" | "replies" | "reposts" | "media"): Promise<number> {
        const result = await this.client
            .select({ count: sql<number>`count(*)` })
            .from(posts)
            .where(and(
                Array.isArray(remoteActorId) ? inArray(posts.remoteActorId, remoteActorId) : eq(posts.remoteActorId, remoteActorId),
                eq(posts.isDeleted, false),
                or(
                    eq(posts.visibility, "public"),
                    eq(posts.visibility, "unlisted")
                ),
                ...filter === "threads" ? [isNull(posts.replyToId)] : [],
    ...filter === "replies" ? [isNotNull(posts.replyToId)] : [],
                ...filter === "reposts" ? [isNotNull(posts.repostOfId), eq(posts.content, "")] : [],
                ...filter === "media" ? [exists(this.client.select().from(attachmentsTable).where(eq(attachmentsTable.postId, posts.id)))] : []
            ));
        return Number(result[0].count);
    }

    async findParentChain(postId: string, currentUserId?: string): Promise<PostWithUserDTO[]> {
        const chain: PostWithUserDTO[] = [];
        
        // Dapatkan kiriman saat ini untuk menemukan induk pertamanya
        const currentPost = await this.findByIdWithDetails(postId, currentUserId);
        let parentId = currentPost?.replyToId;

        // Telusuri ke atas hingga mencapai akar (post pertama)
        while (parentId) {
            const parent = await this.findByIdWithDetails(parentId, currentUserId);
            if (!parent) break;
            
            chain.unshift(parent);
            parentId = parent.replyToId;
        }

        return chain;
    }

    async findThreadDescendants(postId: string, userId: string, currentUserId?: string): Promise<PostWithUserDTO[]> {
        const descendants: PostWithUserDTO[] = [];
        let currentId: string = postId;

        // Follow the chain: find the next reply by the same author
        while (true) {
            const nextInThread = await this.client.query.posts.findFirst({
                where: and(
                    eq(posts.replyToId, currentId),
                    eq(posts.userId, userId),
                    eq(posts.isDeleted, false)
                ),
                orderBy: [asc(posts.createdAt)], // Take the earliest reply if multiple exist by same author
                with: {
                    user: {
                        columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true },
                    },
                    remoteActor: true,
                    attachments: true,
                    reactions: {
                        with: { user: { columns: { username: true } } },
                    },
                    reposts: {
                        where: eq(posts.isDeleted, false),
                        columns: { id: true, userId: true }
                    },
                    replies: {
                        where: eq(posts.isDeleted, false),
                        columns: { id: true }
                    },
                    bookmarks: true,
                    linkPreviews: true,
                }
            });

            if (!nextInThread) break;

            const mappedResults = await this.mapPostsWithStates([nextInThread as any], currentUserId);
            const mapped = mappedResults[0];
            descendants.push(mapped);
            currentId = nextInThread.id;
        }

        return descendants;
    }

    async addReaction(postId: string, userId: string | null, emoji: string, remoteActorId?: string): Promise<void> {
        await this.client.transaction(async (tx) => {
            // Enforce Single Reaction Exclusivity: Delete any existing reaction from this user/actor on this post
            await tx.delete(postReactions).where(
                and(
                    eq(postReactions.postId, postId),
                    userId ? eq(postReactions.userId, userId) : isNull(postReactions.userId),
                    remoteActorId ? eq(postReactions.remoteActorId, remoteActorId) : isNull(postReactions.remoteActorId)
                )
            );

            await tx.insert(postReactions).values({
                id: createId(),
                postId,
                userId,
                remoteActorId,
                emoji
            }).onConflictDoNothing();
        });
    }

    async removeReaction(postId: string, userId: string | null, emoji: string, remoteActorId?: string): Promise<void> {
        await this.client.delete(postReactions).where(
            and(
                eq(postReactions.postId, postId),
                userId ? eq(postReactions.userId, userId) : isNull(postReactions.userId),
                remoteActorId ? eq(postReactions.remoteActorId, remoteActorId) : isNull(postReactions.remoteActorId),
                eq(postReactions.emoji, emoji)
            )
        );
    }

    async getGlobalFeed(limit = 20, offset = 0, currentUserId?: string, filter: "all" | "local" = "all", excludedUserIds?: string[], excludedRemoteActorIds?: string[]): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: and(
                eq(posts.isDeleted, false),
                eq(posts.visibility, "public"),
                filter === "local" 
                    ? isNotNull(posts.userId) 
                    : or(
                        isNotNull(posts.userId),
                        isNotNull(posts.remoteActorId)
                    ),
                excludedUserIds && excludedUserIds.length > 0 ? or(isNull(posts.userId), notInArray(posts.userId, excludedUserIds)) : undefined,
                excludedRemoteActorIds && excludedRemoteActorIds.length > 0 ? or(isNull(posts.remoteActorId), notInArray(posts.remoteActorId, excludedRemoteActorIds)) : undefined
            ),
            orderBy: [desc(posts.createdAt)],
            limit,
            offset,
            with: {
                user: {
                    columns: { username: true, name: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                remoteActor: true,
                attachments: true,
                reactions: {
                    with: { user: { columns: { username: true } }, remoteActor: true },
                },
                replyTo: {
                    with: { 
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } }, 
                        remoteActor: true, 
                        bookmarks: true 
                    },
                },
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                quoteOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                reposts: { 
                    where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                bookmarks: true,
                linkPreviews: true,
            },
        });
        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async getFollowingFeed(followingIds: string[], remoteFollowingIds: string[], limit = 20, offset = 0, currentUserId?: string, excludedUserIds?: string[], excludedRemoteActorIds?: string[]): Promise<PostWithUserDTO[]> {
        const results = await this.client.query.posts.findMany({
            where: (posts, { and, eq, inArray, or, notInArray, isNull }) => and(
                or(
                    followingIds.length > 0 ? inArray(posts.userId, followingIds) : undefined,
                    remoteFollowingIds.length > 0 ? inArray(posts.remoteActorId, remoteFollowingIds) : undefined
                ),
                eq(posts.isDeleted, false),
                or(
                    eq(posts.visibility, "public"),
                    eq(posts.visibility, "unlisted"),
                    currentUserId ? eq(posts.userId, currentUserId) : undefined
                ),
                excludedUserIds && excludedUserIds.length > 0 ? or(isNull(posts.userId), notInArray(posts.userId, excludedUserIds)) : undefined,
                excludedRemoteActorIds && excludedRemoteActorIds.length > 0 ? or(isNull(posts.remoteActorId), notInArray(posts.remoteActorId, excludedRemoteActorIds)) : undefined
            ),
            orderBy: [desc(posts.createdAt)],
            limit,
            offset,
            with: {
                user: {
                    columns: { username: true, name: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                remoteActor: true,
                attachments: true,
                reactions: {
                    with: { user: { columns: { username: true } }, remoteActor: true },
                },
                replyTo: {
                    with: { 
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } }, 
                        remoteActor: true, 
                        bookmarks: true 
                    },
                },
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                quoteOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                reposts: { 
                    where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                bookmarks: true,
                linkPreviews: true,
            },
        });

        return this.mapPostsWithStates(results as any, currentUserId);
    }

    async getDiscoveryFeed(limit = 20, offset = 0, currentUserId?: string, excludedUserIds?: string[], excludedRemoteActorIds?: string[]): Promise<PostWithUserDTO[]> {
        // Simple discovery: show most reacted posts
        const results = await this.client.query.posts.findMany({
            where: and(
                eq(posts.isDeleted, false),
                eq(posts.visibility, "public"),
                excludedUserIds && excludedUserIds.length > 0 ? or(isNull(posts.userId), notInArray(posts.userId, excludedUserIds)) : undefined,
                excludedRemoteActorIds && excludedRemoteActorIds.length > 0 ? or(isNull(posts.remoteActorId), notInArray(posts.remoteActorId, excludedRemoteActorIds)) : undefined
            ),
            orderBy: [desc(posts.createdAt)],
            limit,
            offset,
            with: {
                user: {
                    columns: { username: true, name: true, avatar: true, bio: true, banner: true, customStatus: true },
                },
                remoteActor: true,
                attachments: true,
                reactions: {
                    with: { user: { columns: { username: true } }, remoteActor: true },
                },
                replyTo: {
                    with: { 
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } }, 
                        remoteActor: true, 
                        bookmarks: true 
                    },
                },
                repostOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                quoteOf: {
                    with: {
                        user: { columns: { username: true, avatar: true, bio: true, banner: true, customStatus: true } },
                        remoteActor: true,
                        attachments: true,
                        reactions: true,
                        reposts: { 
                            where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                            with: {
                                user: { columns: { username: true } },
                                remoteActor: { columns: { username: true } }
                            }
                        },
                        replies: { 
                            where: eq(posts.isDeleted, false),
                            columns: { id: true }
                        },
                        bookmarks: true,
                    },
                },
                reposts: { 
                    where: and(eq(posts.isDeleted, false), eq(posts.content, "")),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                replies: {
                    where: eq(posts.isDeleted, false),
                    with: {
                        user: { columns: { username: true } },
                        remoteActor: { columns: { username: true } }
                    }
                },
                bookmarks: true,
                linkPreviews: true,
            },
        });
        return this.mapPostsWithStates(results as any, currentUserId);
    }

    private async mapPostsWithStates(posts: any[], currentUserId?: string): Promise<PostWithUserDTO[]> {
        return posts.map(post => {
            // Priority for counts: apMetadata (remote summary) > actual local records
            const apMeta = post.apMetadata as any;
            const remoteReactionCount = apMeta?.reactionCount;
            const localReactionCount = post.reactions?.length || 0;

            const mappedPost = {
                ...post,
                isLikedByCurrentUser: currentUserId ? post.reactions?.some((r: any) => r.userId === currentUserId && r.emoji === "❤️") : false,
                isRepostedByCurrentUser: currentUserId ? post.reposts?.some((r: any) => r.userId === currentUserId) : false,
                isBookmarkedByCurrentUser: currentUserId ? post.bookmarks?.some((b: any) => b.userId === currentUserId) : false,
                replyCount: post.replies?.length || 0,
                repostCount: post.reposts?.length || 0,
                reactionCount: (post.remoteActorId && remoteReactionCount !== undefined) 
                    ? Math.max(remoteReactionCount, localReactionCount) 
                    : localReactionCount,
                reactionSummary: apMeta?.reactionSummary || null
            };

            if (mappedPost.repostOf) {
                const rApMeta = mappedPost.repostOf.apMetadata as any;
                const rRemoteReactionCount = rApMeta?.reactionCount;
                const rLocalReactionCount = mappedPost.repostOf.reactions?.length || 0;

                mappedPost.repostOf = {
                    ...mappedPost.repostOf,
                    isLikedByCurrentUser: currentUserId ? mappedPost.repostOf.reactions?.some((r: any) => r.userId === currentUserId && r.emoji === "❤️") : false,
                    isRepostedByCurrentUser: currentUserId ? mappedPost.repostOf.reposts?.some((r: any) => r.userId === currentUserId) : false,
                    isBookmarkedByCurrentUser: currentUserId ? mappedPost.repostOf.bookmarks?.some((b: any) => b.userId === currentUserId) : false,
                    replyCount: mappedPost.repostOf.replies?.length || 0,
                    repostCount: mappedPost.repostOf.reposts?.length || 0,
                    reactionCount: (mappedPost.repostOf.remoteActorId && rRemoteReactionCount !== undefined)
                        ? Math.max(rRemoteReactionCount, rLocalReactionCount)
                        : rLocalReactionCount,
                    reactionSummary: rApMeta?.reactionSummary || null
                };
            }

            if (mappedPost.quoteOf) {
                const qApMeta = mappedPost.quoteOf.apMetadata as any;
                const qRemoteReactionCount = qApMeta?.reactionCount;
                const qLocalReactionCount = mappedPost.quoteOf.reactions?.length || 0;

                mappedPost.quoteOf = {
                    ...mappedPost.quoteOf,
                    isLikedByCurrentUser: currentUserId ? mappedPost.quoteOf.reactions?.some((r: any) => r.userId === currentUserId && r.emoji === "❤️") : false,
                    isRepostedByCurrentUser: currentUserId ? mappedPost.quoteOf.reposts?.some((r: any) => r.userId === currentUserId) : false,
                    isBookmarkedByCurrentUser: currentUserId ? mappedPost.quoteOf.bookmarks?.some((b: any) => b.userId === currentUserId) : false,
                    replyCount: mappedPost.quoteOf.replies?.length || 0,
                    repostCount: mappedPost.quoteOf.reposts?.length || 0,
                    reactionCount: (mappedPost.quoteOf.remoteActorId && qRemoteReactionCount !== undefined)
                        ? Math.max(qRemoteReactionCount, qLocalReactionCount)
                        : qLocalReactionCount,
                    reactionSummary: qApMeta?.reactionSummary || null
                };
            }

            if (mappedPost.replyTo) {
                const pApMeta = mappedPost.replyTo.apMetadata as any;
                const pRemoteReactionCount = pApMeta?.reactionCount;
                const pLocalReactionCount = mappedPost.replyTo.reactions?.length || 0;

                mappedPost.replyTo = {
                    ...mappedPost.replyTo,
                    isLikedByCurrentUser: currentUserId ? mappedPost.replyTo.reactions?.some((r: any) => r.userId === currentUserId && r.emoji === "❤️") : false,
                    isRepostedByCurrentUser: currentUserId ? mappedPost.replyTo.reposts?.some((r: any) => r.userId === currentUserId) : false,
                    isBookmarkedByCurrentUser: currentUserId ? mappedPost.replyTo.bookmarks?.some((b: any) => b.userId === currentUserId) : false,
                    replyCount: mappedPost.replyTo.replies?.length || 0,
                    repostCount: mappedPost.replyTo.reposts?.length || 0,
                    reactionCount: (mappedPost.replyTo.remoteActorId && pRemoteReactionCount !== undefined)
                        ? Math.max(pRemoteReactionCount, pLocalReactionCount)
                        : pLocalReactionCount,
                    reactionSummary: pApMeta?.reactionSummary || null
                };
            }

            return mappedPost;
        });
    }
}
