#!/usr/bin/env node

/**
 * Admin Verification Script
 * Checks if admin users exist in the FarmTech system
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const adminSecretCode = process.env.VITE_ADMIN_SECRET_CODE;

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

async function verifyAdminUsers() {
  try {
    console.log('🌾 FarmTech Admin Verification');
    console.log('=============================\n');

    // Check for admin users in profiles table
    const { data: adminUsers, error } = await supabase
      .from('profiles')
      .select('id, email, name, phone, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching admin users:', error.message);
      process.exit(1);
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️  No admin users found in the system!');
      console.log('\n📝 To create an admin user, run:');
      console.log('   npm run create-admin');
      console.log('\n🔐 Admin registration requirements:');
      console.log(`   - Admin secret code: ${adminSecretCode || 'Not set in .env'}`);
      console.log('   - Valid email address');
      console.log('   - Strong password (6+ characters)');
      return;
    }

    console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);

    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   📱 Phone: ${admin.phone || 'Not provided'}`);
      console.log(`   📅 Created: ${new Date(admin.created_at).toLocaleDateString()}`);
      console.log(`   🆔 ID: ${admin.id}`);
      console.log('');
    });

    console.log('🎉 Admin system is properly configured!');
    console.log('\n💡 Admin users can:');
    console.log('   - Access the admin dashboard at /admin');
    console.log('   - Manage materials and inventory');
    console.log('   - Review and approve payments');
    console.log('   - View all user uploads');
    console.log('   - Manage system users');

    // Verify admin secret code
    if (adminSecretCode) {
      console.log(`\n🔐 Admin secret code is configured: ${adminSecretCode}`);
      console.log('   New admins can register using this code');
    } else {
      console.log('\n⚠️  Admin secret code is not set in .env file');
      console.log('   Add VITE_ADMIN_SECRET_CODE to enable admin registration');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the verification
verifyAdminUsers();