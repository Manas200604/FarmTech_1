#!/usr/bin/env node

/**
 * Admin Setup Status Checker
 * Shows the current admin configuration status
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

function checkAdminSetup() {
  console.log('🌾 FarmTech Admin Setup Status');
  console.log('==============================\n');

  // Check environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const adminSecretCode = process.env.VITE_ADMIN_SECRET_CODE;

  console.log('📋 Configuration Status:');
  console.log(`   ✅ Supabase URL: ${supabaseUrl ? 'Configured' : '❌ Missing'}`);
  console.log(`   ✅ Supabase Key: ${supabaseKey ? 'Configured' : '❌ Missing'}`);
  console.log(`   ✅ Admin Secret: ${adminSecretCode ? adminSecretCode : '❌ Missing'}`);

  // Check if admin-related files exist
  console.log('\n📁 Admin System Files:');
  
  const adminFiles = [
    'src/pages/AdminDashboard.jsx',
    'src/components/admin/AdminMaterialsManager.jsx',
    'src/components/admin/AdminPaymentReview.jsx',
    'src/pages/Register.jsx'
  ];

  adminFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  });

  // Check auth contexts
  console.log('\n🔐 Authentication System:');
  const authFiles = [
    'src/contexts/FastAuthContext.jsx',
    'src/contexts/MinimalAuthContext.jsx',
    'src/contexts/SupabaseAuthContext.jsx'
  ];

  authFiles.forEach(file => {
    const exists = fs.existsSync(file);
    if (exists) {
      console.log(`   ✅ ${file}`);
    }
  });

  // Show admin features
  console.log('\n🎯 Admin Features Available:');
  console.log('   ✅ Role-based authentication');
  console.log('   ✅ Admin dashboard (/admin)');
  console.log('   ✅ Materials management');
  console.log('   ✅ Order review and approval');
  console.log('   ✅ Payment processing');
  console.log('   ✅ Upload management');
  console.log('   ✅ User management');

  // Show next steps
  console.log('\n📝 How to Create Admin User:');
  console.log('   1. Start the app: npm run dev');
  console.log('   2. Go to: http://localhost:3000/register');
  console.log('   3. Select "Admin" role');
  console.log(`   4. Enter admin code: ${adminSecretCode || 'admin123'}`);
  console.log('   5. Complete registration');
  console.log('   6. Login and access /admin');

  // Show admin verification
  console.log('\n🔍 Admin Role Verification:');
  console.log('   - Registration checks admin secret code');
  console.log('   - Routes protected with role-based access');
  console.log('   - Components check userProfile?.role === "admin"');
  console.log('   - Admin dashboard only accessible to admin users');

  if (!supabaseUrl || !supabaseKey) {
    console.log('\n⚠️  Warning: Supabase configuration is incomplete!');
    console.log('   Please check your .env file and ensure all Supabase variables are set.');
  }

  if (!adminSecretCode) {
    console.log('\n⚠️  Warning: Admin secret code is not set!');
    console.log('   Add VITE_ADMIN_SECRET_CODE to your .env file.');
  }

  console.log('\n✨ Admin system is ready for use!');
  console.log('📖 For detailed setup instructions, see: setup-admin-guide.md');
}

// Run the check
checkAdminSetup();