ALTER TABLE "Bookmark" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "MessageReaction" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "PostReaction" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "PushSubscription" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Bookmark" ADD COLUMN "remoteActorId" text;--> statement-breakpoint
ALTER TABLE "MessageReaction" ADD COLUMN "remoteActorId" text;--> statement-breakpoint
ALTER TABLE "PostReaction" ADD COLUMN "remoteActorId" text;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "remoteActorId" text;--> statement-breakpoint
ALTER TABLE "PushSubscription" ADD COLUMN "remoteActorId" text;--> statement-breakpoint
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_remoteActorId_RemoteActor_id_fk" FOREIGN KEY ("remoteActorId") REFERENCES "public"."RemoteActor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_remoteActorId_RemoteActor_id_fk" FOREIGN KEY ("remoteActorId") REFERENCES "public"."RemoteActor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_remoteActorId_RemoteActor_id_fk" FOREIGN KEY ("remoteActorId") REFERENCES "public"."RemoteActor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_remoteActorId_RemoteActor_id_fk" FOREIGN KEY ("remoteActorId") REFERENCES "public"."RemoteActor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_remoteActorId_RemoteActor_id_fk" FOREIGN KEY ("remoteActorId") REFERENCES "public"."RemoteActor"("id") ON DELETE no action ON UPDATE no action;