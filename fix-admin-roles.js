#!/usr/bin/env node

/**
 * Fix Admin Roles Script
 * Ensures all admin users have proper admin metadata and roles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAdminRoles() {
  console.log('🔧 FIXING ADMIN ROLES AND PRIVILEGES');
  console.log('=' .repeat(60));
  
  try {
    // Get all users
    const { data: allUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return false;
    }

    // Identify admin users
    const adminEmails = [
      'admin@farmtech.com',
      'admin1@farmtech.com',
      'admin2@farmtech.com', 
      'admin3@farmtech.com',
      'manas28prabhu@gmail.com'
    ];

    console.log(`📊 Total users in system: ${allUsers.users.length}`);
    console.log(`🎯 Admin emails to fix: ${adminEmails.length}`);
    console.log('');

    const results = [];

    for (const adminEmail of adminEmails) {
      console.log(`🔧 Processing: ${adminEmail}`);
      
      const user = allUsers.users.find(u => u.email === adminEmail);
      
      if (!user) {
        console.log(`❌ User not found: ${adminEmail}`);
        results.push({ email: adminEmail, status: 'not_found' });
        continue;
      }

      // Determine admin type and permissions
      const isSuperAdmin = adminEmail === 'admin@farmtech.com';
      const adminName = getAdminName(adminEmail, user.user_metadata);
      const department = getAdminDepartment(adminEmail);

      const updatedMetadata = {
        name: adminName,
        role: 'admin', // FORCE ADMIN ROLE
        department: department,
        isSystemAdmin: isSuperAdmin,
        isSuperAdmin: isSuperAdmin,
        permissions: isSuperAdmin ? getSuperAdminPermissions() : getRegularAdminPermissions(),
        accessLevel: isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN',
        lastUpdated: new Date().toISOString(),
        updatedBy: 'fix-admin-roles-script'
      };

      // Update user metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { user_metadata: updatedMetadata }
      );

      if (updateError) {
        console.error(`❌ Error updating ${adminEmail}:`, updateError.message);
        results.push({ email: adminEmail, status: 'error', error: updateError.message });
        continue;
      }

      console.log(`✅ Fixed: ${adminEmail}`);
      console.log(`   👤 Name: ${adminName}`);
      console.log(`   🔑 Role: admin (FORCED)`);
      console.log(`   👑 Super Admin: ${isSuperAdmin ? 'Yes' : 'No'}`);
      console.log(`   🏢 Department: ${department}`);
      console.log('');

      results.push({ 
        email: adminEmail, 
        status: 'fixed',
        name: adminName,
        isSuperAdmin,
        department
      });
    }

    // Summary
    console.log('📊 FIX RESULTS:');
    console.log('=' .repeat(30));
    
    const fixed = results.filter(r => r.status === 'fixed');
    const notFound = results.filter(r => r.status === 'not_found');
    const errors = results.filter(r => r.status === 'error');
    
    console.log(`✅ Fixed: ${fixed.length} admin users`);
    console.log(`❌ Not found: ${notFound.length} admin users`);
    console.log(`⚠️  Errors: ${errors.length} admin users`);
    
    if (fixed.length > 0) {
      console.log('\\n✅ FIXED ADMIN USERS:');
      fixed.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.name} (${admin.email})`);
        console.log(`      Type: ${admin.isSuperAdmin ? 'Super Admin' : 'Regular Admin'}`);
        console.log(`      Department: ${admin.department}`);
      });
    }

    return results;

  } catch (error) {
    console.error('❌ Error during admin role fix:', error.message);
    return false;
  }
}

function getAdminName(email, metadata) {
  if (metadata?.name) return metadata.name;
  
  const nameMap = {
    'admin@farmtech.com': 'FarmTech Super Admin',
    'admin1@farmtech.com': 'Admin Manager',
    'admin2@farmtech.com': 'Content Moderator',
    'admin3@farmtech.com': 'Support Administrator',
    'manas28prabhu@gmail.com': 'Manas Prabhu'
  };
  
  return nameMap[email] || email.split('@')[0];
}

function getAdminDepartment(email) {
  const deptMap = {
    'admin@farmtech.com': 'System Administration',
    'admin1@farmtech.com': 'Operations',
    'admin2@farmtech.com': 'Content Management',
    'admin3@farmtech.com': 'Customer Support',
    'manas28prabhu@gmail.com': 'General Administration'
  };
  
  return deptMap[email] || 'Administration';
}

function getSuperAdminPermissions() {
  return {
    // Core Admin Permissions
    analytics: true,
    materials: true,
    payments: true,
    uploads: true,
    users: true,
    reports: true,
    schemes: true,
    contacts: true,
    systemSettings: true,
    
    // Super Admin Exclusive Permissions
    deleteUsers: true,
    deleteData: true,
    modifySystem: true,
    accessLogs: true,
    manageAdmins: true,
    systemOverride: true,
    databaseAccess: true,
    securitySettings: true,
    backupRestore: true,
    auditTrails: true
  };
}

function getRegularAdminPermissions() {
  return {
    // Standard admin permissions
    analytics: true,
    materials: true,
    payments: true,
    uploads: true,
    users: true,
    reports: true,
    schemes: true,
    contacts: true,
    systemSettings: false,
    
    // Limited permissions
    deleteUsers: false,
    deleteData: false,
    modifySystem: false,
    accessLogs: true,
    manageAdmins: false,
    systemOverride: false
  };
}

// Run the fix
fixAdminRoles().then(results => {
  if (results) {
    const fixed = results.filter(r => r.status === 'fixed').length;
    console.log('\\n🎉 ADMIN ROLE FIX COMPLETE!');
    console.log(`✅ ${fixed} admin users now have proper admin privileges!`);
    console.log('\\n🔐 ALL ADMIN ACCOUNTS READY:');
    console.log('   • admin@farmtech.com (Super Admin)');
    console.log('   • admin1@farmtech.com (Regular Admin)');
    console.log('   • admin2@farmtech.com (Regular Admin)');
    console.log('   • admin3@farmtech.com (Regular Admin)');
    console.log('   • manas28prabhu@gmail.com (Regular Admin)');
    console.log('\\n🚀 Login with any admin account to access the Admin Dashboard!');
    process.exit(0);
  } else {
    console.log('\\n❌ Admin role fix failed!');
    process.exit(1);
  }
});