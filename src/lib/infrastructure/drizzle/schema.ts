import { pgTable, text, timestamp, boolean, unique, integer } from "drizzle-orm/pg-core";
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
}));

export const pushSubscriptions = pgTable("PushSubscription", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => users.id),
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
    userId: text("userId").notNull().references(() => users.id),

    // Fediverse Compatibility
    uri: text("uri").unique(),        // Canonical URI
    url: text("url"),                 // Web URL

    // Interactions (Threads & Reposts)
    replyToId: text("replyToId"),
    repostOfId: text("repostOfId"),

    visibility: text("visibility").default("public").notNull(),
    isDeleted: boolean("isDeleted").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
    user: one(users, { fields: [posts.userId], references: [users.id] }),
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
    userId: text("userId").notNull().references(() => users.id),
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
    userId: text("userId").notNull().references(() => users.id),
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
    followerId: text("followerId").notNull().references(() => users.id),
    followingId: text("followingId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
    unq: unique().on(t.followerId, t.followingId),
}));

export const followersRelations = relations(followers, ({ one }) => ({
    follower: one(users, { fields: [followers.followerId], references: [users.id], relationName: "following" }),
    following: one(users, { fields: [followers.followingId], references: [users.id], relationName: "followers" }),
}));

