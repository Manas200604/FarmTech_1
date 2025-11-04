#!/usr/bin/env node

/**
 * Test New Admin Login
 * Tests login for the newly created admin accounts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testAdmins = [
  { email: 'admin1@farmtech.com', name: 'Admin Manager', department: 'Operations' },
  { email: 'admin2@farmtech.com', name: 'Content Moderator', department: 'Content Management' },
  { email: 'admin3@farmtech.com', name: 'Support Administrator', department: 'Customer Support' }
];

async function testAdminLogins() {
  console.log('🔐 TESTING NEW ADMIN LOGINS');
  console.log('=' .repeat(50));
  
  const results = [];
  
  for (let i = 0; i < testAdmins.length; i++) {
    const admin = testAdmins[i];
    console.log(`\\n🧪 Testing Admin ${i + 1}: ${admin.name}`);
    console.log('-' .repeat(40));
    
    try {
      // Test login
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: admin.email,
        password: 'admin123'
      });

      if (signInError) {
        console.error(`❌ Login failed for ${admin.email}:`, signInError.message);
        results.push({ email: admin.email, status: 'failed', error: signInError.message });
        continue;
      }

      console.log(`✅ Login successful for ${admin.email}`);
      console.log(`   👤 Name: ${authData.user.user_metadata?.name}`);
      console.log(`   🏢 Department: ${authData.user.user_metadata?.department}`);
      console.log(`   🔑 Role: ${authData.user.user_metadata?.role}`);
      console.log(`   🆔 User ID: ${authData.user.id}`);
      
      // Check admin privileges
      const metadata = authData.user.user_metadata;
      const isAdmin = metadata?.role === 'admin';
      const isSuperAdmin = metadata?.isSystemAdmin === true || admin.email === 'admin@farmtech.com';
      
      console.log(`   🛡️  Admin Status: ${isAdmin ? 'Yes' : 'No'}`);
      console.log(`   👑 Super Admin: ${isSuperAdmin ? 'Yes' : 'No'}`);
      
      // Test logout
      await supabase.auth.signOut();
      console.log(`   🔓 Logout: Successful`);
      
      results.push({ 
        email: admin.email, 
        status: 'success',
        name: metadata?.name,
        department: metadata?.department,
        isAdmin,
        isSuperAdmin
      });

    } catch (error) {
      console.error(`❌ Error testing ${admin.email}:`, error.message);
      results.push({ email: admin.email, status: 'error', error: error.message });
    }
  }
  
  // Summary
  console.log('\\n📊 LOGIN TEST SUMMARY');
  console.log('=' .repeat(40));
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed' || r.status === 'error');
  
  console.log(`✅ Successful logins: ${successful.length}/${testAdmins.length}`);
  console.log(`❌ Failed logins: ${failed.length}/${testAdmins.length}`);
  
  if (successful.length > 0) {
    console.log('\\n✅ WORKING ADMIN ACCOUNTS:');
    successful.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`      Department: ${admin.department}`);
      console.log(`      Admin: ${admin.isAdmin ? 'Yes' : 'No'}`);
      console.log(`      Super Admin: ${admin.isSuperAdmin ? 'Yes' : 'No'}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\\n❌ FAILED ADMIN ACCOUNTS:');
    failed.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.email}: ${admin.error}`);
    });
  }
  
  return results;
}

// Run the test
testAdminLogins().then(results => {
  const success = results.filter(r => r.status === 'success').length;
  const total = results.length;
  
  if (success === total) {
    console.log('\\n🎉 ALL ADMIN ACCOUNTS WORKING!');
    console.log('You can now login with any of the 3 new admin accounts! 👥');
    process.exit(0);
  } else {
    console.log(`\\n⚠️  ${success}/${total} admin accounts working`);
    process.exit(1);
  }
});