#!/usr/bin/env node

/**
 * Check Admin User Script
 * Verifies if admin@farmtech.com exists and can be accessed
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAdminUser() {
  console.log('🔍 CHECKING ADMIN USER');
  console.log('=' .repeat(40));
  
  try {
    // List all users
    const { data: allUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return false;
    }

    console.log(`📊 Total users found: ${allUsers.users.length}`);
    console.log('');

    // Find admin@farmtech.com
    const adminUser = allUsers.users.find(user => user.email === 'admin@farmtech.com');
    
    if (!adminUser) {
      console.log('❌ admin@farmtech.com NOT FOUND');
      console.log('');
      console.log('📋 All users:');
      allUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.user_metadata?.role || 'no role'})`);
      });
      return false;
    }

    console.log('✅ admin@farmtech.com FOUND!');
    console.log('📧 Email:', adminUser.email);
    console.log('🆔 User ID:', adminUser.id);
    console.log('📅 Created:', adminUser.created_at);
    console.log('✅ Email Confirmed:', adminUser.email_confirmed_at ? 'Yes' : 'No');
    console.log('');
    
    console.log('👤 User Metadata:');
    if (adminUser.user_metadata) {
      Object.entries(adminUser.user_metadata).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    } else {
      console.log('   No metadata found');
    }
    
    console.log('');
    console.log('🔐 Attempting to reset password to admin123...');
    
    // Reset password to admin123
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { password: 'admin123' }
    );

    if (updateError) {
      console.error('❌ Error updating password:', updateError.message);
      return false;
    }

    console.log('✅ Password reset to admin123 successfully!');
    
    return true;

  } catch (error) {
    console.error('❌ Error during check:', error.message);
    return false;
  }
}

// Run the check
checkAdminUser().then(success => {
  if (success) {
    console.log('\\n🎉 ADMIN USER VERIFIED!');
    console.log('admin@farmtech.com is ready with password: admin123');
    process.exit(0);
  } else {
    console.log('\\n❌ Admin user check failed!');
    process.exit(1);
  }
});