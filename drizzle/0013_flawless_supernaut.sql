CREATE TABLE "Notification" (
	"id" text PRIMARY KEY NOT NULL,
	"recipientId" text NOT NULL,
	"actorId" text,
	"remoteActorId" text,
	"type" text NOT NULL,
	"targetId" text,
	"targetType" text,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_User_id_fk" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_User_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_remoteActorId_RemoteActor_id_fk" FOREIGN KEY ("remoteActorId") REFERENCES "public"."RemoteActor"("id") ON DELETE no action ON UPDATE no action;