CREATE INDEX "Follower_remoteFollowingId_idx" ON "Follower" USING btree ("remoteFollowingId");--> statement-breakpoint
CREATE INDEX "RemoteActor_domain_idx" ON "RemoteActor" USING btree ("domain");