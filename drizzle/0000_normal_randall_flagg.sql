CREATE TABLE "Message" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"imageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"userId" text NOT NULL,
	"roomId" text NOT NULL,
	"replyTo" text,
	"isDeleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Permission" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Permission_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "RolePermission" (
	"id" text PRIMARY KEY NOT NULL,
	"roleId" text NOT NULL,
	"permissionId" text NOT NULL,
	CONSTRAINT "RolePermission_roleId_permissionId_unique" UNIQUE("roleId","permissionId")
);
--> statement-breakpoint
CREATE TABLE "Role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Role_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "RoomParticipant" (
	"id" text PRIMARY KEY NOT NULL,
	"roomId" text NOT NULL,
	"userId" text NOT NULL,
	"lastReadAt" timestamp,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "RoomParticipant_roomId_userId_unique" UNIQUE("roomId","userId")
);
--> statement-breakpoint
CREATE TABLE "Room" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"isDirect" boolean DEFAULT false NOT NULL,
	"description" text,
	"isPublic" boolean DEFAULT false NOT NULL,
	"ownerId" text
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserRole" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"roleId" text NOT NULL,
	CONSTRAINT "UserRole_userId_roleId_unique" UNIQUE("userId","roleId")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"avatar" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "Room" ADD CONSTRAINT "Room_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;