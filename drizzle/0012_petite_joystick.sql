ALTER TABLE "Follower" DROP CONSTRAINT "Follower_followerId_followingId_remoteFollowerId_remoteFollowingId_unique";--> statement-breakpoint
ALTER TABLE "Follower" ADD CONSTRAINT "Follower_followerId_followingId_unique" UNIQUE("followerId","followingId");--> statement-breakpoint
ALTER TABLE "Follower" ADD CONSTRAINT "Follower_followerId_remoteFollowingId_unique" UNIQUE("followerId","remoteFollowingId");--> statement-breakpoint
ALTER TABLE "Follower" ADD CONSTRAINT "Follower_remoteFollowerId_followingId_unique" UNIQUE("remoteFollowerId","followingId");