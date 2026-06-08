CREATE TABLE "ActivityLog" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"category" text NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;