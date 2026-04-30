ALTER TABLE "Room" ALTER COLUMN "avatar" SET DEFAULT '/avatars/avatar6.png';--> statement-breakpoint
ALTER TABLE "Room" ALTER COLUMN "avatar" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "avatar" SET DEFAULT '/avatars/avatar1.png';--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "avatar" SET NOT NULL;