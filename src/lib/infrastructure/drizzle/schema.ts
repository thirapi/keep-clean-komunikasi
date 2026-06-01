import { pgTable, text, timestamp, boolean, unique, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("User", {
    id: text("id").primaryKey(),
    username: text("username").unique().notNull(),
    password: text("password").notNull(),
    avatar: text("avatar").default("/avatars/avatar1.png").notNull(),
    bio: text("bio"),
    banner: text("banner"),
    customStatus: text("customStatus"),
    // Fediverse Compatibility
    publicKey: text("publicKey"),
    privateKey: text("privateKey"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
    userRoles: many(userRoles),
    messages: many(messages),
    posts: many(posts),
    roomParticipants: many(roomParticipants),
    sessions: many(sessions),
    reactions: many(messageReactions),
    postReactions: many(postReactions),
    pushSubscriptions: many(pushSubscriptions),
    bookmarks: many(bookmarks),
    receivedNotifications: many(notifications, { relationName: "receivedNotifications" }),
    triggeredNotifications: many(notifications, { relationName: "triggeredNotifications" }),
}));

export const pushSubscriptions = pgTable("PushSubscription", {
    id: text("id").primaryKey(),
    userId: text("userId").references(() => users.id),
    remoteActorId: text("remoteActorId").references(() => remoteActors.id),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
    user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));

export const messages = pgTable("Message", {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
    userId: text("userId").notNull(),
    roomId: text("roomId").notNull(),
    replyTo: text("replyTo"),
    isDeleted: boolean("isDeleted").default(false).notNull(),
});

export const messagesRelations = relations(messages, ({ one, many }) => ({
    user: one(users, { fields: [messages.userId], references: [users.id] }),
    room: one(rooms, { fields: [messages.roomId], references: [rooms.id] }),
    replyToMessage: one(messages, {
        fields: [messages.replyTo],
        references: [messages.id],
        relationName: "replies",
    }),
    replies: many(messages, { relationName: "replies" }),
    attachments: many(attachments),
    reactions: many(messageReactions),
}));

export const posts = pgTable("Post", {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    userId: text("userId").references(() => users.id),
    remoteActorId: text("remoteActorId").references(() => remoteActors.id),

    // Fediverse Compatibility
    uri: text("uri").unique(),        // Canonical URI
    url: text("url"),                 // Web URL
    context: text("context"),         // ActivityPub conversation context URI
    apMetadata: jsonb("apMetadata"), // Fediverse-specific raw metadata

    // Interactions (Threads & Reposts)
    replyToId: text("replyToId"),
    repostOfId: text("repostOfId"),
    quoteOfId: text("quoteOfId"),

    visibility: text("visibility").default("public").notNull(),
    emojis: jsonb("emojis"),
    isDeleted: boolean("isDeleted").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
    user: one(users, { fields: [posts.userId], references: [users.id] }),
    remoteActor: one(remoteActors, { fields: [posts.remoteActorId], references: [remoteActors.id] }),
    attachments: many(attachments),
    reactions: many(postReactions),
    replyTo: one(posts, {
        fields: [posts.replyToId],
        references: [posts.id],
        relationName: "postReplies",
    }),
    replies: many(posts, { relationName: "postReplies" }),
    repostOf: one(posts, {
        fields: [posts.repostOfId],
        references: [posts.id],
        relationName: "reposts",
    }),
    reposts: many(posts, { relationName: "reposts" }),
    quoteOf: one(posts, {
        fields: [posts.quoteOfId],
        references: [posts.id],
        relationName: "quotes",
    }),
    quotes: many(posts, { relationName: "quotes" }),
    bookmarks: many(bookmarks),
    linkPreviews: many(postLinkPreviews),
}));


export const rooms = pgTable("Room", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    isDirect: boolean("isDirect").default(false).notNull(),
    description: text("description"),
    avatar: text("avatar").default("/avatars/avatar6.png").notNull(),
    banner: text("banner"),
    isPublic: boolean("isPublic").default(false).notNull(),
    ownerId: text("ownerId").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const roomsRelations = relations(rooms, ({ many }) => ({
    messages: many(messages),
    participants: many(roomParticipants),
}));

export const roomParticipants = pgTable("RoomParticipant", {
    id: text("id").primaryKey(),
    roomId: text("roomId").notNull(),
    userId: text("userId").notNull(),
    lastReadAt: timestamp("lastReadAt"),
    lastReadMessageId: text("lastReadMessageId").references(() => messages.id),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => ({
    unq: unique().on(t.roomId, t.userId),
}));

export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
    room: one(rooms, { fields: [roomParticipants.roomId], references: [rooms.id] }),
    user: one(users, { fields: [roomParticipants.userId], references: [users.id] }),
}));

export const sessions = pgTable("Session", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const roles = pgTable("Role", {
    id: text("id").primaryKey(),
    name: text("name").unique().notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const rolesRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles),
    permissions: many(rolePermissions),
}));

export const permissions = pgTable("Permission", {
    id: text("id").primaryKey(),
    name: text("name").unique().notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const permissionsRelations = relations(permissions, ({ many }) => ({
    roles: many(rolePermissions),
}));

export const userRoles = pgTable("UserRole", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    roleId: text("roleId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => ({
    unq: unique().on(t.userId, t.roleId),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, { fields: [userRoles.userId], references: [users.id] }),
    role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const rolePermissions = pgTable("RolePermission", {
    id: text("id").primaryKey(),
    roleId: text("roleId").notNull(),
    permissionId: text("permissionId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => ({
    unq: unique().on(t.roleId, t.permissionId),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
    permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const attachments = pgTable("Attachment", {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    key: text("key").notNull(),
    fileType: text("fileType").notNull(),
    size: integer("size"),
    messageId: text("messageId").references(() => messages.id),
    postId: text("postId").references(() => posts.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const attachmentsRelations = relations(attachments, ({ one }) => ({
    message: one(messages, { fields: [attachments.messageId], references: [messages.id] }),
    post: one(posts, { fields: [attachments.postId], references: [posts.id] }),
}));

export const messageReactions = pgTable("MessageReaction", {
    id: text("id").primaryKey(),
    messageId: text("messageId").notNull().references(() => messages.id),
    userId: text("userId").references(() => users.id),
    remoteActorId: text("remoteActorId").references(() => remoteActors.id),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => ({
    unq: unique().on(t.messageId, t.userId, t.emoji),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
    message: one(messages, { fields: [messageReactions.messageId], references: [messages.id] }),
    user: one(users, { fields: [messageReactions.userId], references: [users.id] }),
}));

export const postReactions = pgTable("PostReaction", {
    id: text("id").primaryKey(),
    postId: text("postId").notNull().references(() => posts.id),
    userId: text("userId").references(() => users.id),
    remoteActorId: text("remoteActorId").references(() => remoteActors.id),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => ({
    unq: unique().on(t.postId, t.userId, t.emoji),
}));

export const postReactionsRelations = relations(postReactions, ({ one }) => ({
    post: one(posts, { fields: [postReactions.postId], references: [posts.id] }),
    user: one(users, { fields: [postReactions.userId], references: [users.id] }),
}));

export const followers = pgTable("Follower", {
    id: text("id").primaryKey(),
    followerId: text("followerId").references(() => users.id),
    followingId: text("followingId").references(() => users.id),
    
    // Fediverse Compatibility
    remoteFollowerId: text("remoteFollowerId").references(() => remoteActors.id),
    remoteFollowingId: text("remoteFollowingId").references(() => remoteActors.id),
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
    unq_local: unique().on(t.followerId, t.followingId),
    unq_remote: unique().on(t.followerId, t.remoteFollowingId),
    unq_incoming: unique().on(t.remoteFollowerId, t.followingId),
}));

export const remoteActors = pgTable("RemoteActor", {
    id: text("id").primaryKey(), // Usually the Actor URI
    username: text("username").notNull(),
    domain: text("domain").notNull(),
    name: text("name"),
    bio: text("bio"),
    banner: text("banner"),
    avatar: text("avatar"),
    inbox: text("inbox").notNull(),
    sharedInbox: text("sharedInbox"),
    publicKey: text("publicKey"),
    followerCount: integer("followerCount").default(0).notNull(),
    followingCount: integer("followingCount").default(0).notNull(),
    published: timestamp("published"), // Joining date from the remote instance
    emojis: jsonb("emojis"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const remoteActorsRelations = relations(remoteActors, ({ many }) => ({
    followers: many(followers, { relationName: "remoteFollowers" }),
    following: many(followers, { relationName: "remoteFollowing" }),
}));

export const followersRelations = relations(followers, ({ one }) => ({
    follower: one(users, { fields: [followers.followerId], references: [users.id], relationName: "following" }),
    following: one(users, { fields: [followers.followingId], references: [users.id], relationName: "followers" }),
    remoteFollower: one(remoteActors, { fields: [followers.remoteFollowerId], references: [remoteActors.id], relationName: "remoteFollowers" }),
    remoteFollowing: one(remoteActors, { fields: [followers.remoteFollowingId], references: [remoteActors.id], relationName: "remoteFollowing" }),
}));


export const bookmarks = pgTable("Bookmark", {
    id: text("id").primaryKey(),
    userId: text("userId").references(() => users.id),
    remoteActorId: text("remoteActorId").references(() => remoteActors.id),
    postId: text("postId").notNull().references(() => posts.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
    unq: unique().on(t.userId, t.postId),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
    user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
    post: one(posts, { fields: [bookmarks.postId], references: [posts.id] }),
}));

export const postLinkPreviews = pgTable("PostLinkPreview", {
    id: text("id").primaryKey(),
    postId: text("postId").notNull().references(() => posts.id),
    url: text("url").notNull(),
    title: text("title"),
    description: text("description"),
    image: text("image"),
    siteName: text("siteName"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
    unq: unique().on(t.postId, t.url),
}));

export const postLinkPreviewsRelations = relations(postLinkPreviews, ({ one }) => ({
    post: one(posts, { fields: [postLinkPreviews.postId], references: [posts.id] }),
}));

export const hashtags = pgTable("Hashtag", {
    id: text("id").primaryKey(),
    name: text("name").unique().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postHashtags = pgTable("PostHashtag", {
    id: text("id").primaryKey(),
    postId: text("postId").notNull().references(() => posts.id),
    hashtagId: text("hashtagId").notNull().references(() => hashtags.id),
}, (t) => ({
    unq: unique().on(t.postId, t.hashtagId),
}));

export const postHashtagsRelations = relations(postHashtags, ({ one }) => ({
    post: one(posts, { fields: [postHashtags.postId], references: [posts.id] }),
    hashtag: one(hashtags, { fields: [postHashtags.hashtagId], references: [hashtags.id] }),
}));

export const notifications = pgTable("Notification", {
    id: text("id").primaryKey(),
    recipientId: text("recipientId").notNull().references(() => users.id),
    actorId: text("actorId").references(() => users.id), // Nullable for remote/system
    remoteActorId: text("remoteActorId").references(() => remoteActors.id),
    
    type: text("type").notNull(), // 'like', 'repost', 'reply', 'mention', 'follow', 'quote'
    
    targetId: text("targetId"), // Post ID, Message ID, etc.
    targetType: text("targetType"), // 'post', 'message', 'user'
    
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
    recipient: one(users, { fields: [notifications.recipientId], references: [users.id], relationName: "receivedNotifications" }),
    actor: one(users, { fields: [notifications.actorId], references: [users.id], relationName: "triggeredNotifications" }),
    remoteActor: one(remoteActors, { fields: [notifications.remoteActorId], references: [remoteActors.id] }),
    post: one(posts, { fields: [notifications.targetId], references: [posts.id] }),
}));
