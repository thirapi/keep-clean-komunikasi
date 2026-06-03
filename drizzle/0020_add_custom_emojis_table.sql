CREATE TABLE "CustomEmoji" (
	"id" text PRIMARY KEY NOT NULL,
	"shortcode" text NOT NULL,
	"url" text NOT NULL,
	"category" text DEFAULT 'custom' NOT NULL,
	"isStatic" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "CustomEmoji_shortcode_unique" UNIQUE("shortcode")
);
