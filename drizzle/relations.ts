import { relations } from "drizzle-orm/relations";
import { message, messageReaction, user, pushSubscription, roomParticipant, room, attachment } from "./schema";

export const messageReactionRelations = relations(messageReaction, ({one}) => ({
	message: one(message, {
		fields: [messageReaction.messageId],
		references: [message.id]
	}),
	user: one(user, {
		fields: [messageReaction.userId],
		references: [user.id]
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
}));

export const pushSubscriptionRelations = relations(pushSubscription, ({one}) => ({
	user: one(user, {
		fields: [pushSubscription.userId],
		references: [user.id]
	}),
}));

export const roomParticipantRelations = relations(roomParticipant, ({one}) => ({
	message: one(message, {
		fields: [roomParticipant.lastReadMessageId],
		references: [message.id]
	}),
}));

export const roomRelations = relations(room, ({one}) => ({
	user: one(user, {
		fields: [room.ownerId],
		references: [user.id]
	}),
}));

export const attachmentRelations = relations(attachment, ({one}) => ({
	message: one(message, {
		fields: [attachment.messageId],
		references: [message.id]
	}),
}));
