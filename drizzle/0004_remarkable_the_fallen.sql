CREATE TABLE "MessageReaction" (
	"id" text PRIMARY KEY NOT NULL,
	"messageId" text NOT NULL,
	"userId" text NOT NULL,
	"emoji" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "MessageReaction_messageId_userId_emoji_unique" UNIQUE("messageId","userId","emoji")
);
--> statement-breakpoint
ALTER TABLE "Room" ADD COLUMN "banner" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "banner" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "customStatus" text;--> statement-breakpoint
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;