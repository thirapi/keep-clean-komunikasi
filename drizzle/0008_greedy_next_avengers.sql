CREATE TABLE "Bookmark" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"postId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Bookmark_userId_postId_unique" UNIQUE("userId","postId")
);
--> statement-breakpoint
CREATE TABLE "Hashtag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Hashtag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "PostHashtag" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"hashtagId" text NOT NULL,
	CONSTRAINT "PostHashtag_postId_hashtagId_unique" UNIQUE("postId","hashtagId")
);
--> statement-breakpoint
CREATE TABLE "PostLinkPreview" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"description" text,
	"image" text,
	"siteName" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PostLinkPreview_postId_url_unique" UNIQUE("postId","url")
);
--> statement-breakpoint
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostHashtag" ADD CONSTRAINT "PostHashtag_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostHashtag" ADD CONSTRAINT "PostHashtag_hashtagId_Hashtag_id_fk" FOREIGN KEY ("hashtagId") REFERENCES "public"."Hashtag"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostLinkPreview" ADD CONSTRAINT "PostLinkPreview_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;