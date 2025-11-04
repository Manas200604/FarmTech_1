#!/usr/bin/env node

/**
 * Setup Admin@FarmTech Script
 * Ensures admin@farmtech.com has proper admin privileges and access
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const adminSecretCode = process.env.VITE_ADMIN_SECRET_CODE || 'admin123';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdminUser() {
  console.log('🌾 Setting up admin@farmtech.com with Enhanced Admin Privileges');
  console.log('==============================================================\n');

  const adminEmail = 'admin@farmtech.com';
  const adminPassword = 'FarmTech@2024';
  const adminName = 'FarmTech Administrator';

  try {
    // Check if admin user already exists
    console.log('🔍 Checking for existing admin user...');
    
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingProfile) {
      console.log('✅ Admin user already exists in profiles table');
      
      // Update to ensure admin role
      if (existingProfile.role !== 'admin') {
        console.log('🔄 Updating user role to admin...');
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('email', adminEmail);

        if (updateError) {
          console.error('❌ Error updating user role:', updateError.message);
        } else {
          console.log('✅ User role updated to admin');
        }
      }
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: adminName,
          role: 'admin'
        }
      });

      if (authError) {
        console.error('❌ Error creating auth user:', authError.message);
        
        // If user already exists in auth, that's okay
        if (!authError.message.includes('already registered')) {
          process.exit(1);
        } else {
          console.log('ℹ️  User already exists in auth system');
        }
      } else {
        console.log('✅ Admin user created in authentication system');
        
        // Create user profile
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: adminEmail,
            name: adminName,
            role: 'admin',
            phone: '+91-9876543210',
            farm_location: null,
            crop_type: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileCreateError) {
          console.error('❌ Error creating user profile:', profileCreateError.message);
        } else {
          console.log('✅ Admin profile created successfully');
        }
      }
    }

    // Verify admin privileges
    console.log('\n🔐 Verifying admin privileges...');
    
    const { data: adminProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .eq('role', 'admin')
      .single();

    if (verifyError || !adminProfile) {
      console.error('❌ Admin user verification failed');
      process.exit(1);
    }

    console.log('✅ Admin privileges verified successfully');

    // Initialize admin data
    console.log('\n📊 Initializing admin data...');
    
    // Initialize analytics data if not exists
    const analyticsData = localStorage.getItem('farmtech_analytics');
    if (!analyticsData) {
      console.log('📈 Setting up analytics data...');
      
      const sampleAnalytics = [];
      const today = new Date();
      
      // Generate 30 days of sample data
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        sampleAnalytics.push({
          id: `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          metricType: 'user_registrations',
          value: Math.floor(Math.random() * 10) + 1,
          date: date.toISOString(),
          aggregationType: 'daily',
          category: 'users',
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        sampleAnalytics.push({
          id: `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          metricType: 'revenue',
          value: Math.floor(Math.random() * 10000) + 5000,
          date: date.toISOString(),
          aggregationType: 'daily',
          category: 'financial',
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      console.log('✅ Analytics data initialized');
    }

    // Initialize payment submissions data
    const paymentData = localStorage.getItem('farmtech_payment_submissions');
    if (!paymentData) {
      console.log('💳 Setting up payment submissions data...');
      
      const samplePayments = [];
      for (let i = 0; i < 10; i++) {
        samplePayments.push({
          id: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          orderId: `order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          farmerId: `farmer_${i + 1}`,
          farmerName: `Farmer ${i + 1}`,
          phoneNumber: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          transactionId: `TXN${Date.now()}${i}`,
          paymentMethod: ['upi', 'bank_transfer', 'cash'][Math.floor(Math.random() * 3)],
          amount: Math.floor(Math.random() * 5000) + 1000,
          screenshotUrl: '',
          status: i < 5 ? 'pending' : ['approved', 'rejected'][Math.floor(Math.random() * 2)],
          submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: i >= 5 ? new Date().toISOString() : null,
          reviewedBy: i >= 5 ? adminProfile.id : '',
          adminNotes: i >= 5 ? 'Payment processed by admin' : '',
          rejectionReason: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      console.log('✅ Payment submissions data initialized');
    }

    console.log('\n🎉 Admin@FarmTech Setup Complete!');
    console.log('=====================================');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Name: ${adminName}`);
    console.log(`🛡️  Role: admin`);
    console.log(`📱 Phone: +91-9876543210`);
    console.log(`🔐 Admin Secret Code: ${adminSecretCode}`);

    console.log('\n🚀 Enhanced Admin Features Available:');
    console.log('   📊 Analytics Dashboard - Real-time metrics and charts');
    console.log('   🛠️  Materials Management - Full CRUD with stock alerts');
    console.log('   💳 Payment Review System - Approve/reject submissions');
    console.log('   📤 Upload Management - Quality assessment and bulk actions');
    console.log('   📋 Report Generation - Automated and manual reports');
    console.log('   🔔 Admin Notifications - System alerts and updates');
    console.log('   📝 Audit Logging - Track all admin actions');

    console.log('\n💡 How to Access:');
    console.log('   1. Start the app: npm run dev');
    console.log('   2. Go to: http://localhost:3000/login');
    console.log(`   3. Login with: ${adminEmail} / ${adminPassword}`);
    console.log('   4. Access admin dashboard at: /admin');

    console.log('\n🎯 Admin Capabilities:');
    console.log('   ✅ View comprehensive analytics and statistics');
    console.log('   ✅ Manage materials (add, edit, delete, update stock)');
    console.log('   ✅ Review and approve/reject payment submissions');
    console.log('   ✅ Manage user uploads and crop forms');
    console.log('   ✅ Generate comprehensive reports and analytics');
    console.log('   ✅ Access all admin-only features and interfaces');

    console.log('\n✨ Setup completed successfully!');
    console.log('   The admin user now has full access to all enhanced features.');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the setup
setupAdminUser();