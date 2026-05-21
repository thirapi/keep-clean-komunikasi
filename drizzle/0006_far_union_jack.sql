CREATE TABLE "PostReaction" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"emoji" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PostReaction_postId_userId_emoji_unique" UNIQUE("postId","userId","emoji")
);
--> statement-breakpoint
CREATE TABLE "Post" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"userId" text NOT NULL,
	"uri" text,
	"url" text,
	"replyToId" text,
	"repostOfId" text,
	"visibility" text DEFAULT 'public' NOT NULL,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Post_uri_unique" UNIQUE("uri")
);
--> statement-breakpoint
ALTER TABLE "Attachment" ADD COLUMN "postId" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "publicKey" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "privateKey" text;--> statement-breakpoint
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;