-- =====================================================
-- CREATE 3 ADMIN USERS - CORRECT SQL FOR SUPABASE
-- =====================================================
-- Run this in your Supabase SQL Editor

-- IMPORTANT: You cannot create auth users directly via SQL in Supabase
-- The auth.users table is managed by Supabase Auth service
-- Use the JavaScript script instead: node create-3-admins.js

-- =====================================================
-- VERIFICATION QUERIES ONLY
-- =====================================================
-- Use these queries to check existing admin users

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the admin users were created

-- Basic user information (this should work)
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email IN (
  'admin@farmtech.com',
  'admin1@farmtech.com', 
  'admin2@farmtech.com',
  'admin3@farmtech.com'
)
ORDER BY created_at;

-- If you have access to raw_user_meta_data (try this if the above doesn't show metadata)
-- SELECT 
--   id,
--   email,
--   raw_user_meta_data,
--   created_at
-- FROM auth.users 
-- WHERE email LIKE '%@farmtech.com'
-- ORDER BY created_at;

-- Count total admin users
SELECT COUNT(*) as total_admin_users
FROM auth.users 
WHERE email LIKE '%@farmtech.com';

-- =====================================================
-- WHY SQL DOESN'T WORK FOR CREATING AUTH USERS
-- =====================================================
-- Supabase Auth manages the auth.users table internally
-- Direct SQL inserts are not recommended and may not work
-- Password hashing, email confirmation, and other auth features
-- require the Supabase Auth API

-- =====================================================
-- RECOMMENDED APPROACH: Use the JavaScript Script
-- =====================================================
-- Run this command in your terminal instead:
-- node create-3-admins.js

-- This script uses the Supabase Auth Admin API which:
-- ✅ Properly hashes passwords
-- ✅ Sets up email confirmation
-- ✅ Handles user metadata correctly
-- ✅ Integrates with Supabase Auth system

-- =====================================================
-- ADMIN USERS SUMMARY
-- =====================================================
-- After creation, you'll have these admin accounts:

/*
SUPER ADMIN:
- admin@farmtech.com (password: admin123)
  * Complete system control
  * Can delete data and users
  * System settings access
  * Override capabilities

REGULAR ADMINS:
1. admin1@farmtech.com (password: admin123)
   * Name: Admin Manager
   * Department: Operations
   * Standard admin privileges

2. admin2@farmtech.com (password: admin123)
   * Name: Content Moderator  
   * Department: Content Management
   * Standard admin privileges

3. admin3@farmtech.com (password: admin123)
   * Name: Support Administrator
   * Department: Customer Support
   * Standard admin privileges

ADMIN CAPABILITIES:
✅ Materials management
✅ Payment review and approval
✅ Upload moderation
✅ User management (view only)
✅ Analytics and reporting
✅ Scheme and contact management
❌ System settings (super admin only)
❌ Delete users (super admin only)
❌ System override (super admin only)
*/