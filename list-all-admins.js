#!/usr/bin/env node

/**
 * List All Admin Users
 * Shows all admin users in the system with their details
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

async function listAllAdmins() {
  console.log('👥 ALL ADMIN USERS IN SYSTEM');
  console.log('=' .repeat(60));
  
  try {
    // Get all users
    const { data: allUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return false;
    }

    // Filter for admin users and farmtech.com emails
    const adminUsers = allUsers.users.filter(user => 
      user.email.includes('@farmtech.com') || 
      user.user_metadata?.role === 'admin'
    );

    console.log(`📊 Total users in system: ${allUsers.users.length}`);
    console.log(`👑 Admin users found: ${adminUsers.length}`);
    console.log('');

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
      return false;
    }

    // Display each admin user
    adminUsers.forEach((user, index) => {
      const metadata = user.user_metadata || {};
      const isSuperAdmin = user.email === 'admin@farmtech.com' || metadata.isSystemAdmin === true;
      
      console.log(`${index + 1}. ${isSuperAdmin ? '👑' : '🛡️'} ${metadata.name || 'Unnamed Admin'}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   🏢 Department: ${metadata.department || 'Not specified'}`);
      console.log(`   🔑 Role: ${metadata.role || 'admin'}`);
      console.log(`   👑 Super Admin: ${isSuperAdmin ? 'Yes' : 'No'}`);
      console.log(`   📅 Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log(`   ✅ Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   🕐 Last Login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}`);
      
      if (metadata.permissions) {
        const permissionCount = Object.values(metadata.permissions).filter(p => p === true).length;
        console.log(`   🔐 Permissions: ${permissionCount} granted`);
      }
      
      console.log('');
    });

    // Summary by type
    const superAdmins = adminUsers.filter(user => 
      user.email === 'admin@farmtech.com' || user.user_metadata?.isSystemAdmin === true
    );
    const regularAdmins = adminUsers.filter(user => 
      user.email !== 'admin@farmtech.com' && user.user_metadata?.isSystemAdmin !== true
    );

    console.log('📋 ADMIN SUMMARY:');
    console.log('=' .repeat(30));
    console.log(`👑 Super Admins: ${superAdmins.length}`);
    console.log(`🛡️  Regular Admins: ${regularAdmins.length}`);
    console.log(`📧 Total Admin Accounts: ${adminUsers.length}`);

    // Login credentials summary
    console.log('\\n🔐 LOGIN CREDENTIALS:');
    console.log('=' .repeat(35));
    adminUsers.forEach((user, index) => {
      const metadata = user.user_metadata || {};
      const isSuperAdmin = user.email === 'admin@farmtech.com' || metadata.isSystemAdmin === true;
      
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Password: admin123`);
      console.log(`   Type: ${isSuperAdmin ? 'Super Admin' : 'Regular Admin'}`);
      console.log(`   Name: ${metadata.name || 'Unnamed'}`);
      console.log('');
    });

    // Capabilities summary
    console.log('🎯 ADMIN CAPABILITIES:');
    console.log('=' .repeat(30));
    console.log('👑 SUPER ADMIN (admin@farmtech.com):');
    console.log('   ✅ Complete system control');
    console.log('   ✅ Delete users and data');
    console.log('   ✅ System settings access');
    console.log('   ✅ Override any restriction');
    console.log('');
    console.log('🛡️  REGULAR ADMINS (admin1, admin2, admin3):');
    console.log('   ✅ Materials management');
    console.log('   ✅ Payment review and approval');
    console.log('   ✅ Upload moderation');
    console.log('   ✅ Analytics and reporting');
    console.log('   ✅ User management (view only)');
    console.log('   ❌ System settings (super admin only)');
    console.log('   ❌ Delete users (super admin only)');

    return true;

  } catch (error) {
    console.error('❌ Error listing admins:', error.message);
    return false;
  }
}

// Run the listing
listAllAdmins().then(success => {
  if (success) {
    console.log('\\n🎉 ADMIN LISTING COMPLETE!');
    console.log('All admin accounts are ready for use! 👥');
    process.exit(0);
  } else {
    console.log('\\n❌ Failed to list admin users!');
    process.exit(1);
  }
});