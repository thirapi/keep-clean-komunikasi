import { PrismaClient } from "@/generated/prisma"; 
const prisma = new PrismaClient();

async function main() {
  const permissions = [
    { name: "create_message", description: "Create a new message" },
    { name: "delete_message", description: "Delete a message" },
    { name: "view_user", description: "View user information" },
    { name: "manage_roles", description: "Manage roles and permissions" },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  const roles = [
    { name: "super_admin", description: "Super Administrator with all access" },
    { name: "admin", description: "Administrator with full access" },
    { name: "moderator", description: "Moderator with limited access" },
    { name: "user", description: "Regular user" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const adminRole = await prisma.role.findUnique({
    where: { name: "admin" },
  });

  const allPermissions = await prisma.permission.findMany();

  // assign semua permission ke admin
  if (adminRole) {
    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  console.log("✅ Seeding selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
