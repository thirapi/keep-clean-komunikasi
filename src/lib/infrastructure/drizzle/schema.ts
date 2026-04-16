import { pgTable, text, timestamp, boolean, unique, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("User", {
    id: text("id").primaryKey(),
    username: text("username").unique().notNull(),
    password: text("password").notNull(),
    avatar: text("avatar"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
    userRoles: many(userRoles),
    messages: many(messages),
    roomParticipants: many(roomParticipants),
    sessions: many(sessions),
}));

export const messages = pgTable("Message", {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    imageUrl: text("imageUrl"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
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
}));

export const rooms = pgTable("Room", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    isDirect: boolean("isDirect").default(false).notNull(),
    description: text("description"),
    isPublic: boolean("isPublic").default(false).notNull(),
    ownerId: text("ownerId").references(() => users.id),
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
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
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
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const roles = pgTable("Role", {
    id: text("id").primaryKey(),
    name: text("name").unique().notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
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
});

export const permissionsRelations = relations(permissions, ({ many }) => ({
    roles: many(rolePermissions),
}));

export const userRoles = pgTable("UserRole", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    roleId: text("roleId").notNull(),
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
}, (t) => ({
    unq: unique().on(t.roleId, t.permissionId),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
    permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));
