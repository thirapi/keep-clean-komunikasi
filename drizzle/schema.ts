import { pgTable, foreignKey, unique, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const messageReaction = pgTable("MessageReaction", {
	id: text().primaryKey().notNull(),
	messageId: text().notNull(),
	userId: text(),
	emoji: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	remoteActorId: text(),
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
	foreignKey({
			columns: [table.remoteActorId],
			foreignColumns: [remoteActor.id],
			name: "MessageReaction_remoteActorId_RemoteActor_id_fk"
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
	remoteActorId: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "PushSubscription_userId_User_id_fk"
		}),
	foreignKey({
			columns: [table.remoteActorId],
			foreignColumns: [remoteActor.id],
			name: "PushSubscription_remoteActorId_RemoteActor_id_fk"
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

export const postHashtag = pgTable("PostHashtag", {
	id: text().primaryKey().notNull(),
	postId: text().notNull(),
	hashtagId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [post.id],
			name: "PostHashtag_postId_Post_id_fk"
		}),
	foreignKey({
			columns: [table.hashtagId],
			foreignColumns: [hashtag.id],
			name: "PostHashtag_hashtagId_Hashtag_id_fk"
		}),
	unique("PostHashtag_postId_hashtagId_unique").on(table.postId, table.hashtagId),
]);

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

export const hashtag = pgTable("Hashtag", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("Hashtag_name_unique").on(table.name),
]);

export const user = pgTable("User", {
	id: text().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	avatar: text().default('/avatars/avatar1.png').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	bio: text(),
	banner: text(),
	customStatus: text(),
	publicKey: text(),
	privateKey: text(),
}, (table) => [
	unique("User_username_unique").on(table.username),
]);

export const postLinkPreview = pgTable("PostLinkPreview", {
	id: text().primaryKey().notNull(),
	postId: text().notNull(),
	url: text().notNull(),
	title: text(),
	description: text(),
	image: text(),
	siteName: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [post.id],
			name: "PostLinkPreview_postId_Post_id_fk"
		}),
	unique("PostLinkPreview_postId_url_unique").on(table.postId, table.url),
]);

export const bookmark = pgTable("Bookmark", {
	id: text().primaryKey().notNull(),
	userId: text(),
	postId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	remoteActorId: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Bookmark_userId_User_id_fk"
		}),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [post.id],
			name: "Bookmark_postId_Post_id_fk"
		}),
	foreignKey({
			columns: [table.remoteActorId],
			foreignColumns: [remoteActor.id],
			name: "Bookmark_remoteActorId_RemoteActor_id_fk"
		}),
	unique("Bookmark_userId_postId_unique").on(table.userId, table.postId),
]);

export const postReaction = pgTable("PostReaction", {
	id: text().primaryKey().notNull(),
	postId: text().notNull(),
	userId: text(),
	emoji: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	remoteActorId: text(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [post.id],
			name: "PostReaction_postId_Post_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "PostReaction_userId_User_id_fk"
		}),
	foreignKey({
			columns: [table.remoteActorId],
			foreignColumns: [remoteActor.id],
			name: "PostReaction_remoteActorId_RemoteActor_id_fk"
		}),
	unique("PostReaction_postId_userId_emoji_unique").on(table.postId, table.userId, table.emoji),
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
	postId: text(),
}, (table) => [
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [message.id],
			name: "Attachment_messageId_Message_id_fk"
		}),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [post.id],
			name: "Attachment_postId_Post_id_fk"
		}),
]);

export const follower = pgTable("Follower", {
	id: text().primaryKey().notNull(),
	followerId: text(),
	followingId: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	remoteFollowerId: text(),
	remoteFollowingId: text(),
}, (table) => [
	foreignKey({
			columns: [table.followerId],
			foreignColumns: [user.id],
			name: "Follower_followerId_User_id_fk"
		}),
	foreignKey({
			columns: [table.followingId],
			foreignColumns: [user.id],
			name: "Follower_followingId_User_id_fk"
		}),
	foreignKey({
			columns: [table.remoteFollowerId],
			foreignColumns: [remoteActor.id],
			name: "Follower_remoteFollowerId_RemoteActor_id_fk"
		}),
	foreignKey({
			columns: [table.remoteFollowingId],
			foreignColumns: [remoteActor.id],
			name: "Follower_remoteFollowingId_RemoteActor_id_fk"
		}),
	unique("Follower_followerId_followingId_unique").on(table.followerId, table.followingId),
	unique("Follower_followerId_remoteFollowingId_unique").on(table.followerId, table.remoteFollowingId),
	unique("Follower_remoteFollowerId_followingId_unique").on(table.followingId, table.remoteFollowerId),
]);

export const remoteActor = pgTable("RemoteActor", {
	id: text().primaryKey().notNull(),
	username: text().notNull(),
	domain: text().notNull(),
	name: text(),
	avatar: text(),
	inbox: text().notNull(),
	sharedInbox: text(),
	publicKey: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	bio: text(),
	banner: text(),
	followerCount: integer().default(0).notNull(),
	followingCount: integer().default(0).notNull(),
	published: timestamp({ mode: 'string' }),
	emojis: jsonb(),
});

export const notification = pgTable("Notification", {
	id: text().primaryKey().notNull(),
	recipientId: text().notNull(),
	actorId: text(),
	remoteActorId: text(),
	type: text().notNull(),
	targetId: text(),
	targetType: text(),
	isRead: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [user.id],
			name: "Notification_recipientId_User_id_fk"
		}),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [user.id],
			name: "Notification_actorId_User_id_fk"
		}),
	foreignKey({
			columns: [table.remoteActorId],
			foreignColumns: [remoteActor.id],
			name: "Notification_remoteActorId_RemoteActor_id_fk"
		}),
]);

export const post = pgTable("Post", {
	id: text().primaryKey().notNull(),
	content: text().notNull(),
	userId: text(),
	uri: text(),
	url: text(),
	replyToId: text(),
	repostOfId: text(),
	visibility: text().default('public').notNull(),
	isDeleted: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	remoteActorId: text(),
	emojis: jsonb(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Post_userId_User_id_fk"
		}),
	foreignKey({
			columns: [table.remoteActorId],
			foreignColumns: [remoteActor.id],
			name: "Post_remoteActorId_RemoteActor_id_fk"
		}),
	unique("Post_uri_unique").on(table.uri),
]);
