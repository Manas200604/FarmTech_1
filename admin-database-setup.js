#!/usr/bin/env node

/**
 * Enhanced Admin Database Setup Script
 * Sets up database schema extensions for enhanced admin management system
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAnalyticsMetricsTable() {
  console.log('📊 Setting up analytics_metrics table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create analytics_metrics table
      CREATE TABLE IF NOT EXISTS analytics_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        metric_type VARCHAR(50) NOT NULL,
        value DECIMAL(15,2) NOT NULL,
        date DATE NOT NULL,
        metadata JSONB DEFAULT '{}',
        aggregation_type VARCHAR(20) DEFAULT 'daily',
        category VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type_date ON analytics_metrics(metric_type, date);
      CREATE INDEX IF NOT EXISTS idx_analytics_metrics_date ON analytics_metrics(date);
      CREATE INDEX IF NOT EXISTS idx_analytics_metrics_category ON analytics_metrics(category);
      CREATE INDEX IF NOT EXISTS idx_analytics_metrics_aggregation ON analytics_metrics(aggregation_type);

      -- Create updated_at trigger
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_analytics_metrics_updated_at ON analytics_metrics;
      CREATE TRIGGER update_analytics_metrics_updated_at
        BEFORE UPDATE ON analytics_metrics
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `
  });

  if (error) {
    console.error('❌ Error creating analytics_metrics table:', error.message);
    return false;
  }

  console.log('✅ Analytics metrics table created successfully');
  return true;
}

async function setupPaymentSubmissionsTable() {
  console.log('💳 Setting up payment_submissions table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create payment_submissions table
      CREATE TABLE IF NOT EXISTS payment_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID,
        farmer_id UUID,
        farmer_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        transaction_id VARCHAR(100) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'upi',
        amount DECIMAL(10,2) NOT NULL,
        screenshot_url TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by UUID,
        admin_notes TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_payment_submissions_status ON payment_submissions(status);
      CREATE INDEX IF NOT EXISTS idx_payment_submissions_farmer ON payment_submissions(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_payment_submissions_date ON payment_submissions(submitted_at);
      CREATE INDEX IF NOT EXISTS idx_payment_submissions_order ON payment_submissions(order_id);
      CREATE INDEX IF NOT EXISTS idx_payment_submissions_transaction ON payment_submissions(transaction_id);

      -- Create updated_at trigger
      DROP TRIGGER IF EXISTS update_payment_submissions_updated_at ON payment_submissions;
      CREATE TRIGGER update_payment_submissions_updated_at
        BEFORE UPDATE ON payment_submissions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `
  });

  if (error) {
    console.error('❌ Error creating payment_submissions table:', error.message);
    return false;
  }

  console.log('✅ Payment submissions table created successfully');
  return true;
}

async function setupReportConfigurationsTable() {
  console.log('📋 Setting up report_configurations table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create report_configurations table
      CREATE TABLE IF NOT EXISTS report_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        parameters JSONB DEFAULT '{}',
        schedule VARCHAR(100), -- cron expression
        format VARCHAR(20) DEFAULT 'pdf',
        recipients TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        is_scheduled BOOLEAN DEFAULT false,
        last_generated TIMESTAMP WITH TIME ZONE,
        next_scheduled TIMESTAMP WITH TIME ZONE,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_report_configurations_type ON report_configurations(type);
      CREATE INDEX IF NOT EXISTS idx_report_configurations_active ON report_configurations(is_active);
      CREATE INDEX IF NOT EXISTS idx_report_configurations_scheduled ON report_configurations(is_scheduled);
      CREATE INDEX IF NOT EXISTS idx_report_configurations_next_scheduled ON report_configurations(next_scheduled);
      CREATE INDEX IF NOT EXISTS idx_report_configurations_created_by ON report_configurations(created_by);

      -- Create updated_at trigger
      DROP TRIGGER IF EXISTS update_report_configurations_updated_at ON report_configurations;
      CREATE TRIGGER update_report_configurations_updated_at
        BEFORE UPDATE ON report_configurations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `
  });

  if (error) {
    console.error('❌ Error creating report_configurations table:', error.message);
    return false;
  }

  console.log('✅ Report configurations table created successfully');
  return true;
}

async function enhanceMaterialsTable() {
  console.log('🛠️ Enhancing materials table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Add enhanced columns to materials table if they don't exist
      DO $$ 
      BEGIN
        -- Add price_history column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'price_history') THEN
          ALTER TABLE materials ADD COLUMN price_history JSONB DEFAULT '[]';
        END IF;

        -- Add low_stock_threshold column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'low_stock_threshold') THEN
          ALTER TABLE materials ADD COLUMN low_stock_threshold INTEGER DEFAULT 10;
        END IF;

        -- Add reorder_level column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'reorder_level') THEN
          ALTER TABLE materials ADD COLUMN reorder_level INTEGER DEFAULT 20;
        END IF;

        -- Add supplier column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'supplier') THEN
          ALTER TABLE materials ADD COLUMN supplier JSONB DEFAULT '{}';
        END IF;

        -- Add tags column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'tags') THEN
          ALTER TABLE materials ADD COLUMN tags TEXT[] DEFAULT '{}';
        END IF;

        -- Add is_active column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'is_active') THEN
          ALTER TABLE materials ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;

        -- Add seo_metadata column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'seo_metadata') THEN
          ALTER TABLE materials ADD COLUMN seo_metadata JSONB DEFAULT '{}';
        END IF;

        -- Add sales_count column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'sales_count') THEN
          ALTER TABLE materials ADD COLUMN sales_count INTEGER DEFAULT 0;
        END IF;

        -- Add revenue column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'revenue') THEN
          ALTER TABLE materials ADD COLUMN revenue DECIMAL(12,2) DEFAULT 0;
        END IF;

        -- Add last_sold column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'last_sold') THEN
          ALTER TABLE materials ADD COLUMN last_sold TIMESTAMP WITH TIME ZONE;
        END IF;
      END $$;

      -- Create additional indexes for enhanced materials table
      CREATE INDEX IF NOT EXISTS idx_materials_low_stock ON materials(low_stock_threshold) WHERE stock <= low_stock_threshold;
      CREATE INDEX IF NOT EXISTS idx_materials_reorder ON materials(reorder_level) WHERE stock <= reorder_level;
      CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);
      CREATE INDEX IF NOT EXISTS idx_materials_tags ON materials USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_materials_sales_count ON materials(sales_count);
      CREATE INDEX IF NOT EXISTS idx_materials_revenue ON materials(revenue);
      CREATE INDEX IF NOT EXISTS idx_materials_last_sold ON materials(last_sold);
    `
  });

  if (error) {
    console.error('❌ Error enhancing materials table:', error.message);
    return false;
  }

  console.log('✅ Materials table enhanced successfully');
  return true;
}

async function setupAdminNotificationsTable() {
  console.log('🔔 Setting up admin_notifications table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create admin_notifications table
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL, -- 'low_stock', 'payment_submitted', 'upload_pending', etc.
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
        is_read BOOLEAN DEFAULT false,
        recipient_id UUID, -- admin user id
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP WITH TIME ZONE
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient ON admin_notifications(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON admin_notifications(is_read) WHERE is_read = false;
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);
    `
  });

  if (error) {
    console.error('❌ Error creating admin_notifications table:', error.message);
    return false;
  }

  console.log('✅ Admin notifications table created successfully');
  return true;
}

async function setupAdminAuditLogTable() {
  console.log('📝 Setting up admin_audit_log table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create admin_audit_log table
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID NOT NULL,
        admin_name VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject', etc.
        resource_type VARCHAR(50) NOT NULL, -- 'material', 'payment', 'upload', 'user', etc.
        resource_id VARCHAR(100),
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON admin_audit_log(admin_id);
      CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
      CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource ON admin_audit_log(resource_type, resource_id);
      CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);
    `
  });

  if (error) {
    console.error('❌ Error creating admin_audit_log table:', error.message);
    return false;
  }

  console.log('✅ Admin audit log table created successfully');
  return true;
}

async function insertSampleAnalyticsData() {
  console.log('📈 Inserting sample analytics data...');
  
  const sampleData = [];
  const today = new Date();
  
  // Generate sample data for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // User metrics
    sampleData.push({
      metric_type: 'user_registrations',
      value: Math.floor(Math.random() * 10) + 1,
      date: dateStr,
      aggregation_type: 'daily',
      category: 'users'
    });
    
    sampleData.push({
      metric_type: 'active_users',
      value: Math.floor(Math.random() * 50) + 20,
      date: dateStr,
      aggregation_type: 'daily',
      category: 'users'
    });
    
    // Revenue metrics
    sampleData.push({
      metric_type: 'revenue',
      value: Math.floor(Math.random() * 10000) + 5000,
      date: dateStr,
      aggregation_type: 'daily',
      category: 'financial'
    });
    
    // Order metrics
    sampleData.push({
      metric_type: 'orders_count',
      value: Math.floor(Math.random() * 20) + 5,
      date: dateStr,
      aggregation_type: 'daily',
      category: 'orders'
    });
    
    // Upload metrics
    sampleData.push({
      metric_type: 'uploads_count',
      value: Math.floor(Math.random() * 15) + 3,
      date: dateStr,
      aggregation_type: 'daily',
      category: 'uploads'
    });
  }
  
  // Insert sample data
  const { error } = await supabase
    .from('analytics_metrics')
    .insert(sampleData);
  
  if (error) {
    console.error('❌ Error inserting sample analytics data:', error.message);
    return false;
  }
  
  console.log('✅ Sample analytics data inserted successfully');
  return true;
}

async function verifySetup() {
  console.log('🔍 Verifying database setup...');
  
  const tables = [
    'analytics_metrics',
    'payment_submissions', 
    'report_configurations',
    'admin_notifications',
    'admin_audit_log'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Error verifying table ${table}:`, error.message);
      return false;
    }
    
    console.log(`✅ Table ${table} is accessible`);
  }
  
  // Verify enhanced materials table
  const { data: materialsData, error: materialsError } = await supabase
    .from('materials')
    .select('id, price_history, low_stock_threshold, reorder_level')
    .limit(1);
  
  if (materialsError) {
    console.error('❌ Error verifying enhanced materials table:', materialsError.message);
    return false;
  }
  
  console.log('✅ Enhanced materials table is accessible');
  return true;
}

async function main() {
  console.log('🌾 FarmTech Enhanced Admin Database Setup');
  console.log('==========================================\n');
  
  try {
    // Setup all tables
    const setupResults = await Promise.all([
      setupAnalyticsMetricsTable(),
      setupPaymentSubmissionsTable(),
      setupReportConfigurationsTable(),
      enhanceMaterialsTable(),
      setupAdminNotificationsTable(),
      setupAdminAuditLogTable()
    ]);
    
    if (setupResults.every(result => result)) {
      console.log('\n✅ All database tables created successfully');
      
      // Insert sample data
      await insertSampleAnalyticsData();
      
      // Verify setup
      const verified = await verifySetup();
      
      if (verified) {
        console.log('\n🎉 Enhanced admin database setup completed successfully!');
        console.log('\n📋 Created tables:');
        console.log('   - analytics_metrics (with sample data)');
        console.log('   - payment_submissions');
        console.log('   - report_configurations');
        console.log('   - admin_notifications');
        console.log('   - admin_audit_log');
        console.log('   - Enhanced materials table with new columns');
        
        console.log('\n🚀 You can now use the enhanced admin features:');
        console.log('   - Analytics dashboard with real metrics');
        console.log('   - Payment review and approval system');
        console.log('   - Report generation and scheduling');
        console.log('   - Admin notifications and audit logging');
        console.log('   - Enhanced materials management');
      } else {
        console.log('\n⚠️  Setup completed but verification failed');
        process.exit(1);
      }
    } else {
      console.log('\n❌ Some database setup operations failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();