-- 1. Insert Initial Permissions
INSERT INTO "Permission" (id, name, description, "createdAt") VALUES 
('perm_1', 'create_message', 'Create a new message', NOW()),
('perm_2', 'delete_message', 'Delete a message', NOW()),
('perm_3', 'view_user', 'View user information', NOW()),
('perm_4', 'manage_roles', 'Manage roles and permissions', NOW());

-- 2. Insert Initial Roles
INSERT INTO "Role" (id, name, description, "createdAt") VALUES 
('role_admin', 'admin', 'Administrator with full access', NOW()),
('role_user', 'user', 'Regular user', NOW());

-- 3. Link Admin Role with all Permissions
INSERT INTO "RolePermission" (id, "roleId", "permissionId") VALUES 
('rp_1', 'role_admin', 'perm_1'),
('rp_2', 'role_admin', 'perm_2'),
('rp_3', 'role_admin', 'perm_3'),
('rp_4', 'role_admin', 'perm_4');

-- 4. Insert Default Admin User: raph (Password: matakokmerem)
INSERT INTO "User" (id, username, password, "createdAt") VALUES 
('user_admin_01', 'raph', '$2b$10$UZ1U4rr7JYnommsySPL7FuS2LB8v2OoJ2MmzoyrnCAtsmWHr2lwwC', NOW());

-- 5. Assign Admin Role to raph
INSERT INTO "UserRole" (id, "userId", "roleId") VALUES 
('ur_1', 'user_admin_01', 'role_admin');

-- 6. Create Default General Channel (ID: general-channel)
INSERT INTO "Room" (id, name, "isDirect", "description", "isPublic", "ownerId") VALUES 
('general-channel', 'general', false, 'Channel utama untuk semua anggota', true, 'user_admin_01');

-- 7. Join raph to General Channel
INSERT INTO "RoomParticipant" (id, "roomId", "userId", "joinedAt") VALUES 
('part_1', 'general-channel', 'user_admin_01', NOW());