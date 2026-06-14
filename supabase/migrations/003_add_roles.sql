-- Migration 003: Add org_admin and support roles
-- Valid role values: 'user' | 'org_admin' | 'support' | 'global_admin'

-- Add check constraint to enforce valid role values
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'org_admin', 'support', 'global_admin'));

-- Update any legacy 'admin' values
UPDATE users SET role = 'global_admin' WHERE role = 'admin';

COMMENT ON COLUMN users.role IS 'user | org_admin | support | global_admin';
