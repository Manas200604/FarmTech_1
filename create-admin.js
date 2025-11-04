#!/usr/bin/env node

/**
 * Admin User Creation Script
 * Creates an admin user in the FarmTech system
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const adminSecretCode = process.env.VITE_ADMIN_SECRET_CODE;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

if (!adminSecretCode) {
  console.error('❌ Missing VITE_ADMIN_SECRET_CODE in .env file');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function askPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    let password = '';

    process.stdin.on('data', function (char) {
      char = char + '';

      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function createAdminUser() {
  try {
    console.log('🌾 FarmTech Admin User Creation');
    console.log('================================\n');

    // Get admin details
    const name = await askQuestion('Enter admin name: ');
    const email = await askQuestion('Enter admin email: ');
    const password = await askPassword('Enter admin password: ');
    const phone = await askQuestion('Enter admin phone (optional): ');

    if (!name || !email || !password) {
      console.error('❌ Name, email, and password are required');
      process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }

    // Validate password strength
    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    console.log('\n🔄 Creating admin user...');

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: 'admin',
        phone: phone || null
      }
    });

    if (authError) {
      console.error('❌ Error creating user in auth:', authError.message);
      process.exit(1);
    }

    console.log('✅ User created in authentication system');

    // User profile is stored in user_metadata, no separate table needed
    console.log('✅ User profile created with metadata');
    console.log('\n🎉 Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🔑 Role: admin');
    console.log('📱 Phone:', phone || 'Not provided');
    console.log('\n💡 The admin can now log in using the provided credentials.');
    console.log(`🔐 Admin secret code for registration: ${adminSecretCode}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function checkExistingAdmin() {
  try {
    // Check if any admin users already exist by checking auth users
    const { data: allUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error checking existing users:', error.message);
      return false;
    }

    // Filter for admin users
    const existingAdmins = allUsers.users.filter(user =>
      user.user_metadata?.role === 'admin' ||
      user.email === 'admin@farmtech.com'
    );

    if (existingAdmins && existingAdmins.length > 0) {
      console.log('ℹ️  Existing admin users found:');
      existingAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.user_metadata?.name || admin.email} (${admin.email})`);
      });
      console.log('');

      const proceed = await askQuestion('Do you want to create another admin user? (y/N): ');
      return proceed.toLowerCase() === 'y' || proceed.toLowerCase() === 'yes';
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking existing admins:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Checking for existing admin users...\n');

  const shouldProceed = await checkExistingAdmin();

  if (shouldProceed) {
    await createAdminUser();
  } else {
    console.log('👋 Admin creation cancelled.');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Admin creation cancelled.');
  rl.close();
  process.exit(0);
});

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error.message);
  rl.close();
  process.exit(1);
});