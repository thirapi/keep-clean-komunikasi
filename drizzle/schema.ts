import { pgTable, foreignKey, unique, text, timestamp, boolean, integer } from "drizzle-orm/pg-core"

export const messageReaction = pgTable("MessageReaction", {
	id: text().primaryKey().notNull(),
	messageId: text().notNull(),
	userId: text(),
	emoji: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [message.id],
			name: "MessageReaction_messageId_Message_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "MessageReaction_userId_User_id_fk"
		}),
	unique("MessageReaction_messageId_userId_emoji_unique").on(table.messageId, table.userId, table.emoji),
]);

export const pushSubscription = pgTable("PushSubscription", {
	id: text().primaryKey().notNull(),
	userId: text(),
	endpoint: text().notNull(),
	p256Dh: text().notNull(),
	auth: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "PushSubscription_userId_User_id_fk"
		}),
]);

export const message = pgTable("Message", {
	id: text().primaryKey().notNull(),
	content: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	userId: text().notNull(),
	roomId: text().notNull(),
	replyTo: text(),
	isDeleted: boolean().default(false).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const permission = pgTable("Permission", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("Permission_name_unique").on(table.name),
]);

export const rolePermission = pgTable("RolePermission", {
	id: text().primaryKey().notNull(),
	roleId: text().notNull(),
	permissionId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("RolePermission_roleId_permissionId_unique").on(table.roleId, table.permissionId),
]);

export const role = pgTable("Role", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("Role_name_unique").on(table.name),
]);

export const roomParticipant = pgTable("RoomParticipant", {
	id: text().primaryKey().notNull(),
	roomId: text().notNull(),
	userId: text().notNull(),
	lastReadAt: timestamp({ mode: 'string' }),
	joinedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastReadMessageId: text(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.lastReadMessageId],
			foreignColumns: [message.id],
			name: "RoomParticipant_lastReadMessageId_Message_id_fk"
		}),
	unique("RoomParticipant_roomId_userId_unique").on(table.roomId, table.userId),
]);

export const session = pgTable("Session", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const userRole = pgTable("UserRole", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	roleId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("UserRole_userId_roleId_unique").on(table.userId, table.roleId),
]);

export const room = pgTable("Room", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	isDirect: boolean().default(false).notNull(),
	description: text(),
	avatar: text().default('/avatars/avatar6.png').notNull(),
	isPublic: boolean().default(false).notNull(),
	ownerId: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	banner: text(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "Room_ownerId_User_id_fk"
		}),
]);

export const user = pgTable("User", {
	id: text().primaryKey().notNull(),
	username: text().notNull(),
	name: text(),
	password: text().notNull(),
	avatar: text().default('/avatars/avatar1.png').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	bio: text(),
	banner: text(),
	customStatus: text(),
}, (table) => [
	unique("User_username_unique").on(table.username),
]);

export const customEmoji = pgTable("CustomEmoji", {
	id: text().primaryKey().notNull(),
	shortcode: text().notNull(),
	url: text().notNull(),
	category: text().default('custom').notNull(),
	isStatic: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("CustomEmoji_shortcode_unique").on(table.shortcode),
]);

export const attachment = pgTable("Attachment", {
	id: text().primaryKey().notNull(),
	url: text().notNull(),
	key: text().notNull(),
	fileType: text().notNull(),
	size: integer(),
	blurhash: text(),
	messageId: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [message.id],
			name: "Attachment_messageId_Message_id_fk"
		}),
]);
