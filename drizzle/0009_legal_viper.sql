CREATE TABLE "RemoteActor" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"domain" text NOT NULL,
	"name" text,
	"avatar" text,
	"inbox" text NOT NULL,
	"sharedInbox" text,
	"publicKey" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Follower" DROP CONSTRAINT "Follower_followerId_followingId_unique";--> statement-breakpoint
ALTER TABLE "Follower" ALTER COLUMN "followerId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Follower" ALTER COLUMN "followingId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Follower" ADD COLUMN "remoteFollowerId" text;--> statement-breakpoint
ALTER TABLE "Follower" ADD COLUMN "remoteFollowingId" text;--> statement-breakpoint
ALTER TABLE "Follower" ADD CONSTRAINT "Follower_remoteFollowerId_RemoteActor_id_fk" FOREIGN KEY ("remoteFollowerId") REFERENCES "public"."RemoteActor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Follower" ADD CONSTRAINT "Follower_remoteFollowingId_RemoteActor_id_fk" FOREIGN KEY ("remoteFollowingId") REFERENCES "public"."RemoteActor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Follower" ADD CONSTRAINT "Follower_followerId_followingId_remoteFollowerId_remoteFollowingId_unique" UNIQUE("followerId","followingId","remoteFollowerId","remoteFollowingId");