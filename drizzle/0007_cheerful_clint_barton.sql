CREATE TABLE "Follower" (
	"id" text PRIMARY KEY NOT NULL,
	"followerId" text NOT NULL,
	"followingId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Follower_followerId_followingId_unique" UNIQUE("followerId","followingId")
);
--> statement-breakpoint
ALTER TABLE "Follower" ADD CONSTRAINT "Follower_followerId_User_id_fk" FOREIGN KEY ("followerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Follower" ADD CONSTRAINT "Follower_followingId_User_id_fk" FOREIGN KEY ("followingId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;