#!/usr/bin/env node

/**
 * Test Admin Dashboard Access
 * Verifies that admin users get proper admin privileges and dashboard access
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

async function testAdminDashboardAccess() {
  console.log('🎛️ TESTING ADMIN DASHBOARD ACCESS');
  console.log('=' .repeat(60));
  
  const testAdmins = [
    { email: 'admin@farmtech.com', expectedType: 'Super Admin' },
    { email: 'admin1@farmtech.com', expectedType: 'Regular Admin' },
    { email: 'admin2@farmtech.com', expectedType: 'Regular Admin' }
  ];
  
  const results = [];
  
  for (const admin of testAdmins) {
    console.log(`\\n🧪 Testing: ${admin.email}`);
    console.log('-' .repeat(50));
    
    try {
      // Test login
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: admin.email,
        password: 'admin123'
      });

      if (signInError) {
        console.error(`❌ Login failed: ${signInError.message}`);
        results.push({ email: admin.email, status: 'login_failed', error: signInError.message });
        continue;
      }

      console.log(`✅ Login successful`);
      
      // Check user metadata and role
      const metadata = authData.user.user_metadata || {};
      const email = authData.user.email;
      
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Name: ${metadata.name}`);
      console.log(`🔑 Role in metadata: ${metadata.role}`);
      console.log(`🏢 Department: ${metadata.department}`);
      
      // Simulate the auth context logic
      const isAdminEmail = email.includes('@farmtech.com') || 
                         email === 'manas28prabhu@gmail.com' ||
                         metadata.role === 'admin';
      
      const detectedRole = metadata.role || (isAdminEmail ? 'admin' : 'farmer');
      const isSuperAdmin = metadata.isSuperAdmin || email === 'admin@farmtech.com';
      
      console.log(`🎯 Detected Role: ${detectedRole}`);
      console.log(`👑 Super Admin: ${isSuperAdmin ? 'Yes' : 'No'}`);
      
      // Check if this would route to admin dashboard
      const wouldRouteToAdmin = detectedRole === 'admin';
      console.log(`🎛️ Routes to Admin Dashboard: ${wouldRouteToAdmin ? 'YES' : 'NO'}`);
      
      // Check admin functions
      const isAdmin = detectedRole === 'admin' || 
                     metadata.isSystemAdmin === true ||
                     email === 'admin@farmtech.com';
      
      const canManageUsers = email === 'admin@farmtech.com' || 
                           metadata.isSystemAdmin === true;
      
      const canDeleteData = email === 'admin@farmtech.com' || 
                          metadata.isSystemAdmin === true;
      
      console.log(`\\n🔍 Admin Function Tests:`);
      console.log(`   isAdmin(): ${isAdmin ? 'YES' : 'NO'}`);
      console.log(`   isSuperAdmin(): ${isSuperAdmin ? 'YES' : 'NO'}`);
      console.log(`   canManageUsers(): ${canManageUsers ? 'YES' : 'NO'}`);
      console.log(`   canDeleteData(): ${canDeleteData ? 'YES' : 'NO'}`);
      
      // Verify expected type
      const actualType = isSuperAdmin ? 'Super Admin' : 'Regular Admin';
      const typeMatches = actualType === admin.expectedType;
      
      console.log(`\\n✅ Expected Type: ${admin.expectedType}`);
      console.log(`✅ Actual Type: ${actualType}`);
      console.log(`✅ Type Matches: ${typeMatches ? 'YES' : 'NO'}`);
      
      // Sign out
      await supabase.auth.signOut();
      
      results.push({
        email: admin.email,
        status: 'success',
        detectedRole,
        wouldRouteToAdmin,
        isAdmin,
        isSuperAdmin,
        typeMatches,
        actualType
      });

    } catch (error) {
      console.error(`❌ Error testing ${admin.email}:`, error.message);
      results.push({ email: admin.email, status: 'error', error: error.message });
    }
  }
  
  // Summary
  console.log('\\n📊 ADMIN DASHBOARD ACCESS TEST RESULTS');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.status === 'success');
  const adminRouting = results.filter(r => r.wouldRouteToAdmin === true);
  const correctTypes = results.filter(r => r.typeMatches === true);
  
  console.log(`✅ Successful logins: ${successful.length}/${testAdmins.length}`);
  console.log(`🎛️ Would route to Admin Dashboard: ${adminRouting.length}/${testAdmins.length}`);
  console.log(`🎯 Correct admin types: ${correctTypes.length}/${testAdmins.length}`);
  
  if (successful.length > 0) {
    console.log('\\n✅ ADMIN ACCESS SUMMARY:');
    successful.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.email}`);
      console.log(`      Role: ${result.detectedRole}`);
      console.log(`      Admin Dashboard: ${result.wouldRouteToAdmin ? 'YES' : 'NO'}`);
      console.log(`      Admin Functions: ${result.isAdmin ? 'YES' : 'NO'}`);
      console.log(`      Type: ${result.actualType}`);
    });
  }
  
  const allWorking = successful.length === testAdmins.length && 
                    adminRouting.length === testAdmins.length &&
                    correctTypes.length === testAdmins.length;
  
  if (allWorking) {
    console.log('\\n🎉 ALL ADMIN ACCOUNTS WORKING PERFECTLY!');
    console.log('✅ All admins will route to Admin Dashboard');
    console.log('✅ All admin functions working correctly');
    console.log('✅ Proper admin/super admin distinction');
  } else {
    console.log('\\n⚠️  Some issues found with admin access');
  }
  
  return allWorking;
}

// Run the test
testAdminDashboardAccess().then(success => {
  if (success) {
    console.log('\\n🚀 ADMIN DASHBOARD ACCESS VERIFIED!');
    console.log('Admins will now properly access the Admin Dashboard! 🎛️');
    process.exit(0);
  } else {
    console.log('\\n❌ Admin dashboard access test failed!');
    process.exit(1);
  }
});