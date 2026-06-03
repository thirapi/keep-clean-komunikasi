CREATE TABLE "AccountFilter" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"targetUserId" text,
	"targetRemoteActorId" text,
	"type" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "AccountFilter_userId_targetUserId_unique" UNIQUE("userId","targetUserId"),
	CONSTRAINT "AccountFilter_userId_targetRemoteActorId_unique" UNIQUE("userId","targetRemoteActorId")
);
--> statement-breakpoint
ALTER TABLE "AccountFilter" ADD CONSTRAINT "AccountFilter_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AccountFilter" ADD CONSTRAINT "AccountFilter_targetUserId_User_id_fk" FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AccountFilter" ADD CONSTRAINT "AccountFilter_targetRemoteActorId_RemoteActor_id_fk" FOREIGN KEY ("targetRemoteActorId") REFERENCES "public"."RemoteActor"("id") ON DELETE no action ON UPDATE no action;