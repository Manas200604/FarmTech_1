#!/usr/bin/env node

/**
 * Create 3 Admin Users Script
 * Creates 3 additional admin users for the FarmTech system
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

// Admin users to create
const adminUsers = [
  {
    email: 'admin1@farmtech.com',
    password: 'admin123',
    name: 'Admin Manager',
    role: 'admin',
    department: 'Operations'
  },
  {
    email: 'admin2@farmtech.com', 
    password: 'admin123',
    name: 'Content Moderator',
    role: 'admin',
    department: 'Content Management'
  },
  {
    email: 'admin3@farmtech.com',
    password: 'admin123', 
    name: 'Support Administrator',
    role: 'admin',
    department: 'Customer Support'
  }
];

async function createAdminUsers() {
  console.log('👥 CREATING 3 ADMIN USERS');
  console.log('=' .repeat(50));
  
  const results = [];
  
  for (let i = 0; i < adminUsers.length; i++) {
    const admin = adminUsers[i];
    console.log(`\\n🔧 Creating Admin ${i + 1}: ${admin.name}`);
    console.log('-' .repeat(40));
    
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(user => user.email === admin.email);
      
      if (existingUser) {
        console.log(`⚠️  User ${admin.email} already exists, skipping...`);
        results.push({ email: admin.email, status: 'exists', user: existingUser });
        continue;
      }
      
      // Create the admin user
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          name: admin.name,
          role: admin.role,
          department: admin.department,
          isSystemAdmin: false, // Regular admin, not super admin
          permissions: {
            // Standard admin permissions
            analytics: true,
            materials: true,
            payments: true,
            uploads: true,
            users: true,
            reports: true,
            schemes: true,
            contacts: true,
            systemSettings: false, // No system settings access
            
            // Limited permissions compared to super admin
            deleteUsers: false,
            deleteData: false,
            modifySystem: false,
            accessLogs: true,
            manageAdmins: false,
            systemOverride: false
          },
          accessLevel: 'ADMIN',
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        }
      });

      if (createError) {
        console.error(`❌ Error creating ${admin.email}:`, createError.message);
        results.push({ email: admin.email, status: 'error', error: createError.message });
        continue;
      }

      console.log(`✅ User created: ${admin.email}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   👤 Name: ${admin.name}`);
      console.log(`   🏢 Department: ${admin.department}`);
      console.log(`   🔑 Role: ${admin.role}`);
      console.log(`   🆔 User ID: ${authData.user.id}`);
      
      results.push({ 
        email: admin.email, 
        status: 'created', 
        user: authData.user,
        name: admin.name,
        department: admin.department
      });

    } catch (error) {
      console.error(`❌ Unexpected error creating ${admin.email}:`, error.message);
      results.push({ email: admin.email, status: 'error', error: error.message });
    }
  }
  
  // Summary
  console.log('\\n📊 CREATION SUMMARY');
  console.log('=' .repeat(40));
  
  const created = results.filter(r => r.status === 'created');
  const existing = results.filter(r => r.status === 'exists');
  const errors = results.filter(r => r.status === 'error');
  
  console.log(`✅ Created: ${created.length} admin users`);
  console.log(`⚠️  Already existed: ${existing.length} admin users`);
  console.log(`❌ Errors: ${errors.length} admin users`);
  
  if (created.length > 0) {
    console.log('\\n👥 NEW ADMIN USERS CREATED:');
    created.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`      Department: ${admin.department}`);
      console.log(`      Password: admin123`);
    });
  }
  
  if (existing.length > 0) {
    console.log('\\n⚠️  EXISTING ADMIN USERS:');
    existing.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.email}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\\n❌ FAILED CREATIONS:');
    errors.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.email}: ${admin.error}`);
    });
  }
  
  console.log('\\n🔐 ADMIN LOGIN CREDENTIALS:');
  console.log('=' .repeat(35));
  adminUsers.forEach((admin, index) => {
    console.log(`${index + 1}. Email: ${admin.email}`);
    console.log(`   Password: ${admin.password}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Department: ${admin.department}`);
    console.log('');
  });
  
  console.log('🎯 ADMIN CAPABILITIES:');
  console.log('   ✅ Materials management');
  console.log('   ✅ Payment review and approval');
  console.log('   ✅ Upload moderation');
  console.log('   ✅ User management (view only)');
  console.log('   ✅ Analytics and reporting');
  console.log('   ✅ Scheme and contact management');
  console.log('   ❌ System settings (super admin only)');
  console.log('   ❌ Delete users (super admin only)');
  console.log('   ❌ System override (super admin only)');
  
  return results;
}

// Run the creation
createAdminUsers().then(results => {
  const success = results.filter(r => r.status === 'created' || r.status === 'exists').length;
  const total = results.length;
  
  if (success === total) {
    console.log('\\n🎉 ALL ADMIN USERS READY!');
    console.log('You now have multiple admin accounts for testing and management! 👥');
    process.exit(0);
  } else {
    console.log(`\\n⚠️  ${success}/${total} admin users ready`);
    process.exit(1);
  }
});