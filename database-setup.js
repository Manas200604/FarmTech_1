#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates necessary tables and initial data for FarmTech
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

async function createTables() {
  console.log('🔄 Checking database tables...\n');

  try {
    // Check if profiles table exists by trying to query it
    const { error: profilesCheckError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesCheckError && profilesCheckError.message.includes('does not exist')) {
      console.log('⚠️  Profiles table does not exist.');
      console.log('📝 Please create the following tables in your Supabase dashboard:');
      console.log('\n1. profiles table:');
      console.log(`
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin')),
  farm_location TEXT,
  crop_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
      `);
      return false;
    } else {
      console.log('✅ Profiles table exists');
    }

    // Check materials table
    const { error: materialsCheckError } = await supabase
      .from('materials')
      .select('id')
      .limit(1);

    if (materialsCheckError && materialsCheckError.message.includes('does not exist')) {
      console.log('⚠️  Materials table does not exist.');
      console.log('\n2. materials table:');
      console.log(`
CREATE TABLE public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  category TEXT NOT NULL DEFAULT 'general',
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view materials" ON public.materials
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage materials" ON public.materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
      `);
      return false;
    } else {
      console.log('✅ Materials table exists');
    }

    // Check orders table
    const { error: ordersCheckError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (ordersCheckError && ordersCheckError.message.includes('does not exist')) {
      console.log('⚠️  Orders table does not exist.');
      console.log('\n3. orders table:');
      console.log(`
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
      `);
      return false;
    } else {
      console.log('✅ Orders table exists');
    }

  } catch (error) {
    console.error('❌ Unexpected error checking tables:', error.message);
    return false;
  }

  return true;
}

async function createInitialData() {
  console.log('\n🔄 Creating initial data...\n');

  try {
    // Create sample materials
    const sampleMaterials = [
      {
        name: 'Organic Fertilizer',
        description: 'High-quality organic fertilizer for all crops',
        price: 25.00,
        unit: 'kg',
        category: 'fertilizer',
        stock_quantity: 100
      },
      {
        name: 'Seeds - Wheat',
        description: 'Premium wheat seeds for optimal yield',
        price: 15.00,
        unit: 'kg',
        category: 'seeds',
        stock_quantity: 50
      },
      {
        name: 'Pesticide - Natural',
        description: 'Eco-friendly natural pesticide',
        price: 30.00,
        unit: 'liter',
        category: 'pesticide',
        stock_quantity: 25
      }
    ];

    const { error: materialsError } = await supabase
      .from('materials')
      .upsert(sampleMaterials, { onConflict: 'name' });

    if (materialsError) {
      console.error('❌ Error creating sample materials:', materialsError.message);
    } else {
      console.log('✅ Sample materials created successfully');
    }

  } catch (error) {
    console.error('❌ Unexpected error creating initial data:', error.message);
  }
}

async function main() {
  console.log('🌾 FarmTech Database Setup');
  console.log('=========================\n');

  const tablesCreated = await createTables();
  
  if (tablesCreated) {
    await createInitialData();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run "npm run create-admin" to create an admin user');
    console.log('   2. Run "npm run verify-admin" to verify admin setup');
    console.log('   3. Start the application with "npm run dev"');
  } else {
    console.log('\n❌ Database setup failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the setup
main().catch((error) => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});