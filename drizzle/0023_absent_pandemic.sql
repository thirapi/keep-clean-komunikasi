ALTER TABLE "User" ADD COLUMN "alsoKnownAs" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "movedTo" text;