-- drizzle/0001_init-seed-data.sql
-- 1. Insert Initial Permissions
INSERT INTO "Permission" (id, name, description, "createdAt") VALUES 
('perm_1', 'create_message', 'Create a new message', NOW()),
('perm_2', 'delete_message', 'Delete a message', NOW()),
('perm_3', 'view_user', 'View user information', NOW()),
('perm_4', 'manage_roles', 'Manage roles and permissions', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Initial Roles
INSERT INTO "Role" (id, name, description, "createdAt") VALUES 
('role_admin', 'admin', 'Administrator with full access', NOW()),
('role_user', 'user', 'Regular user', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Link Admin Role with all Permissions
INSERT INTO "RolePermission" (id, "roleId", "permissionId") VALUES 
('rp_1', 'role_admin', 'perm_1'),
('rp_2', 'role_admin', 'perm_2'),
('rp_3', 'role_admin', 'perm_3'),
('rp_4', 'role_admin', 'perm_4')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Default Admin User
INSERT INTO "User" (id, username, password, "createdAt") VALUES 
('user_admin_01', 'insomeniac', '$2b$10$UZ1U4rr7JYnommsySPL7FuS2LB8v2OoJ2MmzoyrnCAtsmWHr2lwwC', NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Assign Admin Role to user
INSERT INTO "UserRole" (id, "userId", "roleId") VALUES 
('ur_1', 'user_admin_01', 'role_admin')
ON CONFLICT (id) DO NOTHING;

-- 6. Create Default General Channel
INSERT INTO "Room" (id, name, "isDirect", "description", "isPublic", "ownerId") VALUES 
('general-channel', 'general', false, 'Channel utama untuk semua anggota', true, 'user_admin_01')
ON CONFLICT (id) DO NOTHING;

-- 7. Join user to General Channel
INSERT INTO "RoomParticipant" (id, "roomId", "userId", "joinedAt") VALUES 
('part_1', 'general-channel', 'user_admin_01', NOW())
ON CONFLICT (id) DO NOTHING;