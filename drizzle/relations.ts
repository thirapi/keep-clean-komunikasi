import { relations } from "drizzle-orm/relations";
import { message, messageReaction, user, remoteActor, pushSubscription, roomParticipant, post, postHashtag, hashtag, room, postLinkPreview, bookmark, postReaction, attachment, follower, notification } from "./schema";

export const messageReactionRelations = relations(messageReaction, ({one}) => ({
	message: one(message, {
		fields: [messageReaction.messageId],
		references: [message.id]
	}),
	user: one(user, {
		fields: [messageReaction.userId],
		references: [user.id]
	}),
	remoteActor: one(remoteActor, {
		fields: [messageReaction.remoteActorId],
		references: [remoteActor.id]
	}),
}));

export const messageRelations = relations(message, ({many}) => ({
	messageReactions: many(messageReaction),
	roomParticipants: many(roomParticipant),
	attachments: many(attachment),
}));

export const userRelations = relations(user, ({many}) => ({
	messageReactions: many(messageReaction),
	pushSubscriptions: many(pushSubscription),
	rooms: many(room),
	bookmarks: many(bookmark),
	postReactions: many(postReaction),
	followers_followerId: many(follower, {
		relationName: "follower_followerId_user_id"
	}),
	followers_followingId: many(follower, {
		relationName: "follower_followingId_user_id"
	}),
	posts: many(post),
	notifications_recipientId: many(notification, {
		relationName: "notification_recipientId_user_id"
	}),
	notifications_actorId: many(notification, {
		relationName: "notification_actorId_user_id"
	}),
}));

export const remoteActorRelations = relations(remoteActor, ({many}) => ({
	messageReactions: many(messageReaction),
	pushSubscriptions: many(pushSubscription),
	bookmarks: many(bookmark),
	postReactions: many(postReaction),
	followers_remoteFollowerId: many(follower, {
		relationName: "follower_remoteFollowerId_remoteActor_id"
	}),
	followers_remoteFollowingId: many(follower, {
		relationName: "follower_remoteFollowingId_remoteActor_id"
	}),
	posts: many(post),
	notifications: many(notification),
}));

export const pushSubscriptionRelations = relations(pushSubscription, ({one}) => ({
	user: one(user, {
		fields: [pushSubscription.userId],
		references: [user.id]
	}),
	remoteActor: one(remoteActor, {
		fields: [pushSubscription.remoteActorId],
		references: [remoteActor.id]
	}),
}));

export const roomParticipantRelations = relations(roomParticipant, ({one}) => ({
	message: one(message, {
		fields: [roomParticipant.lastReadMessageId],
		references: [message.id]
	}),
}));

export const postHashtagRelations = relations(postHashtag, ({one}) => ({
	post: one(post, {
		fields: [postHashtag.postId],
		references: [post.id]
	}),
	hashtag: one(hashtag, {
		fields: [postHashtag.hashtagId],
		references: [hashtag.id]
	}),
}));

export const postRelations = relations(post, ({one, many}) => ({
	postHashtags: many(postHashtag),
	postLinkPreviews: many(postLinkPreview),
	bookmarks: many(bookmark),
	postReactions: many(postReaction),
	attachments: many(attachment),
	user: one(user, {
		fields: [post.userId],
		references: [user.id]
	}),
	remoteActor: one(remoteActor, {
		fields: [post.remoteActorId],
		references: [remoteActor.id]
	}),
}));

export const hashtagRelations = relations(hashtag, ({many}) => ({
	postHashtags: many(postHashtag),
}));

export const roomRelations = relations(room, ({one}) => ({
	user: one(user, {
		fields: [room.ownerId],
		references: [user.id]
	}),
}));

export const postLinkPreviewRelations = relations(postLinkPreview, ({one}) => ({
	post: one(post, {
		fields: [postLinkPreview.postId],
		references: [post.id]
	}),
}));

export const bookmarkRelations = relations(bookmark, ({one}) => ({
	user: one(user, {
		fields: [bookmark.userId],
		references: [user.id]
	}),
	post: one(post, {
		fields: [bookmark.postId],
		references: [post.id]
	}),
	remoteActor: one(remoteActor, {
		fields: [bookmark.remoteActorId],
		references: [remoteActor.id]
	}),
}));

export const postReactionRelations = relations(postReaction, ({one}) => ({
	post: one(post, {
		fields: [postReaction.postId],
		references: [post.id]
	}),
	user: one(user, {
		fields: [postReaction.userId],
		references: [user.id]
	}),
	remoteActor: one(remoteActor, {
		fields: [postReaction.remoteActorId],
		references: [remoteActor.id]
	}),
}));

export const attachmentRelations = relations(attachment, ({one}) => ({
	message: one(message, {
		fields: [attachment.messageId],
		references: [message.id]
	}),
	post: one(post, {
		fields: [attachment.postId],
		references: [post.id]
	}),
}));

export const followerRelations = relations(follower, ({one}) => ({
	user_followerId: one(user, {
		fields: [follower.followerId],
		references: [user.id],
		relationName: "follower_followerId_user_id"
	}),
	user_followingId: one(user, {
		fields: [follower.followingId],
		references: [user.id],
		relationName: "follower_followingId_user_id"
	}),
	remoteActor_remoteFollowerId: one(remoteActor, {
		fields: [follower.remoteFollowerId],
		references: [remoteActor.id],
		relationName: "follower_remoteFollowerId_remoteActor_id"
	}),
	remoteActor_remoteFollowingId: one(remoteActor, {
		fields: [follower.remoteFollowingId],
		references: [remoteActor.id],
		relationName: "follower_remoteFollowingId_remoteActor_id"
	}),
}));

export const notificationRelations = relations(notification, ({one}) => ({
	user_recipientId: one(user, {
		fields: [notification.recipientId],
		references: [user.id],
		relationName: "notification_recipientId_user_id"
	}),
	user_actorId: one(user, {
		fields: [notification.actorId],
		references: [user.id],
		relationName: "notification_actorId_user_id"
	}),
	remoteActor: one(remoteActor, {
		fields: [notification.remoteActorId],
		references: [remoteActor.id]
	}),
}));