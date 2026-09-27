ALTER TABLE "AccountFilter" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Bookmark" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Follower" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Hashtag" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "PostHashtag" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "PostLinkPreview" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "PostReaction" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Post" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "RemoteActor" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "AccountFilter" CASCADE;--> statement-breakpoint
DROP TABLE "Bookmark" CASCADE;--> statement-breakpoint
DROP TABLE "Follower" CASCADE;--> statement-breakpoint
DROP TABLE "Hashtag" CASCADE;--> statement-breakpoint
DROP TABLE "Notification" CASCADE;--> statement-breakpoint
DROP TABLE "PostHashtag" CASCADE;--> statement-breakpoint
DROP TABLE "PostLinkPreview" CASCADE;--> statement-breakpoint
DROP TABLE "PostReaction" CASCADE;--> statement-breakpoint
DROP TABLE "Post" CASCADE;--> statement-breakpoint
DROP TABLE "RemoteActor" CASCADE;--> statement-breakpoint
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_postId_Post_id_fk";
--> statement-breakpoint
ALTER TABLE "MessageReaction" DROP CONSTRAINT "MessageReaction_remoteActorId_RemoteActor_id_fk";
--> statement-breakpoint
ALTER TABLE "PushSubscription" DROP CONSTRAINT "PushSubscription_remoteActorId_RemoteActor_id_fk";
--> statement-breakpoint
ALTER TABLE "PushSubscription" ALTER COLUMN "p256dh" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "PushSubscription" ALTER COLUMN "auth" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "PushSubscription" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "PushSubscription" ADD COLUMN "type" text DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE "Attachment" DROP COLUMN "postId";--> statement-breakpoint
ALTER TABLE "MessageReaction" DROP COLUMN "remoteActorId";--> statement-breakpoint
ALTER TABLE "PushSubscription" DROP COLUMN "remoteActorId";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "publicKey";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "privateKey";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "alsoKnownAs";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "movedTo";