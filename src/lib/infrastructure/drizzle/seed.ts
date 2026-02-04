import { db } from "../../db";
import {
    permissions as permissionsTable,
    roles as rolesTable,
    rolePermissions,
    users as usersTable,
    rooms as roomsTable,
    roomParticipants as roomParticipantsTable,
    userRoles as userRolesTable
} from "./schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { hashSync, genSaltSync } from "bcrypt-ts";

async function main() {
    console.log("🌱 Starting seed...");

    // 1. Permissions
    const permissions = [
        { name: "create_message", description: "Create a new message" },
        { name: "delete_message", description: "Delete a message" },
        { name: "view_user", description: "View user information" },
        { name: "manage_roles", description: "Manage roles and permissions" },
    ];

    for (const permission of permissions) {
        const existing = await db.query.permissions.findFirst({
            where: eq(permissionsTable.name, permission.name),
        });

        if (!existing) {
            await db.insert(permissionsTable).values({
                id: createId(),
                ...permission,
            });
        }
    }

    // 2. Roles
    const roles = [
        { name: "super_admin", description: "Super Administrator with all access" },
        { name: "admin", description: "Administrator with full access" },
        { name: "moderator", description: "Moderator with limited access" },
        { name: "user", description: "Regular user" },
    ];

    for (const role of roles) {
        const existing = await db.query.roles.findFirst({
            where: eq(rolesTable.name, role.name),
        });

        if (!existing) {
            await db.insert(rolesTable).values({
                id: createId(),
                ...role,
            });
        }
    }

    const adminRole = await db.query.roles.findFirst({
        where: eq(rolesTable.name, "admin"),
    });

    const allPermissions = await db.query.permissions.findMany();

    if (adminRole) {
        for (const perm of allPermissions) {
            const existing = await db.query.rolePermissions.findFirst({
                where: and(
                    eq(rolePermissions.roleId, adminRole.id),
                    eq(rolePermissions.permissionId, perm.id)
                ),
            });

            if (!existing) {
                await db.insert(rolePermissions).values({
                    id: createId(),
                    roleId: adminRole.id,
                    permissionId: perm.id,
                });
            }
        }
    }

    // 3. Dev User
    const devUsername = "dev";
    const devPassword = "password123";
    const existingDev = await db.query.users.findFirst({
        where: eq(usersTable.username, devUsername),
    });

    let userId: string;

    if (!existingDev) {
        userId = createId();
        const salt = genSaltSync(10);
        const hashedPassword = hashSync(devPassword, salt);

        await db.insert(usersTable).values({
            id: userId,
            username: devUsername,
            password: hashedPassword,
            avatar: "https://github.com/thirapi.png",
        });
        console.log(`👤 Created dev user: ${devUsername} / ${devPassword}`);
    } else {
        userId = existingDev.id;
    }

    // 4. Assign Admin Role to Dev User
    if (adminRole) {
        const existingUserRole = await db.query.userRoles.findFirst({
            where: and(
                eq(userRolesTable.userId, userId),
                eq(userRolesTable.roleId, adminRole.id)
            ),
        });

        if (!existingUserRole) {
            await db.insert(userRolesTable).values({
                id: createId(),
                userId,
                roleId: adminRole.id,
            });
        }
    }

    // 5. Default Channel
    const defaultRoomID = "cmak9alli0000i5sei9vn5szl";
    const existingRoom = await db.query.rooms.findFirst({
        where: eq(roomsTable.id, defaultRoomID),
    });

    if (!existingRoom) {
        await db.insert(roomsTable).values({
            id: defaultRoomID,
            name: "general",
            isDirect: false,
        });
        console.log(`💬 Created default channel: general`);
    }

    // 6. Join dev user to default channel
    const existingParticipation = await db.query.roomParticipants.findFirst({
        where: and(
            eq(roomParticipantsTable.userId, userId),
            eq(roomParticipantsTable.roomId, defaultRoomID)
        ),
    });

    if (!existingParticipation) {
        await db.insert(roomParticipantsTable).values({
            id: createId(),
            userId,
            roomId: defaultRoomID,
            lastReadAt: new Date(),
        });
    }

    console.log("✅ Seeding selesai.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
