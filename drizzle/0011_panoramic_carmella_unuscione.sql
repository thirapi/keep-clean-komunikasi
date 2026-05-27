ALTER TABLE "RemoteActor" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "RemoteActor" ADD COLUMN "banner" text;--> statement-breakpoint
ALTER TABLE "RemoteActor" ADD COLUMN "followerCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "RemoteActor" ADD COLUMN "followingCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "RemoteActor" ADD COLUMN "published" timestamp;