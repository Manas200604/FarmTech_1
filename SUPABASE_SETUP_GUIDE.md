# 🚀 Complete Supabase Setup Guide for FarmTech

## Prerequisites
- Node.js installed
- A Supabase account (free at [supabase.com](https://supabase.com))

## Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com](https://supabase.com)
   - Click "Start your project" or "New Project"
   - Sign in with GitHub, Google, or email

2. **Create New Project**
   - Click "New Project"
   - Choose your organization (or create one)
   - Enter project details:
     - **Name**: `farmtech` (or your preferred name)
     - **Database Password**: Create a strong password (save this!)
     - **Region**: Choose closest to your users
   - Click "Create new project"
   - Wait 2-3 minutes for setup to complete

## Step 2: Set Up Database Schema

1. **Open SQL Editor**
   - In your Supabase dashboard, click "SQL Editor" in the sidebar
   - Click "New query"

2. **Run the Database Schema**
   - Copy and paste the entire content from `supabase_schema_policies.sql`
   - Click "Run" to execute the SQL
   - You should see "Success. No rows returned" message

3. **Verify Tables Created**
   - Go to "Table Editor" in the sidebar
   - You should see these tables:
     - `users`
     - `uploads` 
     - `schemes`
     - `contacts`
     - `pesticides`
     - `stats`

## Step 3: Set Up Storage

1. **Create Storage Bucket**
   - Click "Storage" in the sidebar
   - Click "New bucket"
   - Enter bucket name: `uploads`
   - Make it **Public** (check the public checkbox)
   - Click "Create bucket"

2. **Configure Storage Policies**
   - Click on the `uploads` bucket
   - Go to "Policies" tab
   - The policies should already be set up from the SQL script
   - Verify you see policies for INSERT, SELECT, UPDATE, DELETE

## Step 4: Get Your Project Credentials

1. **Get Project URL and API Key**
   - Go to "Settings" → "API" in the sidebar
   - Copy these values:
     - **Project URL**: `https://your-project-id.supabase.co`
     - **anon public key**: `eyJ...` (long string starting with eyJ)

2. **Update Environment Variables**
   - Open your `.env` file
   - Replace the placeholder values:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   
   # Application Configuration
   VITE_APP_NAME=FarmTech
   VITE_APP_VERSION=1.0.0
   VITE_ADMIN_SECRET_CODE=admin123
   
   # Demo User Credentials
   VITE_DEMO_ADMIN_EMAIL=admin@farmtech.com
   VITE_DEMO_ADMIN_PASSWORD=admin123456
   VITE_DEMO_FARMER_EMAIL=farmer@farmtech.com
   VITE_DEMO_FARMER_PASSWORD=farmer123456
   ```

## Step 5: Test the Application

1. **Install Dependencies** (if not already done)
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Application**
   - Go to `http://localhost:5173`
   - You should see the FarmTech login page

## Step 6: Seed Demo Data (Optional)

1. **Open Browser Console**
   - In your browser, press F12 to open developer tools
   - Go to the "Console" tab

2. **Import and Run Seed Function**
   ```javascript
   // Import the seed function
   import { seedSupabaseDatabase } from './src/utils/supabaseSeedData.js';
   
   // Run the seed function
   seedSupabaseDatabase();
   ```

   **Alternative Method:**
   - Go to the admin dashboard (login as admin first)
   - Look for a "Seed Database" button in the admin components
   - Click it to populate with demo data

## Step 7: Create Your First Admin User

### Method 1: Using the Application
1. Go to the registration page
2. Fill out the form
3. Select "Admin" as account type
4. Enter the admin code: `admin123` (from your .env file)
5. Complete registration

### Method 2: Using Supabase Dashboard
1. Go to "Authentication" → "Users" in Supabase dashboard
2. Click "Add user"
3. Enter email and password
4. After creating, go to "Table Editor" → "users"
5. Find the user and change `role` from `farmer` to `admin`

## Step 8: Verify Everything Works

### Test User Authentication
- ✅ Register a new farmer account
- ✅ Login with farmer credentials
- ✅ Login with admin credentials
- ✅ Logout functionality

### Test Farmer Features
- ✅ Upload a crop image
- ✅ View uploaded images
- ✅ Browse government schemes
- ✅ View expert contacts
- ✅ Access treatment information

### Test Admin Features
- ✅ View admin dashboard with statistics
- ✅ Manage user uploads
- ✅ Add/edit government schemes
- ✅ Manage expert contacts
- ✅ Review and respond to farmer uploads

### Test Real-time Features
- ✅ Open app in two browser windows
- ✅ Make changes in one window
- ✅ Verify changes appear in the other window automatically

## 🔧 Troubleshooting

### Common Issues:

1. **"Invalid API key" Error**
   - Double-check your `VITE_SUPABASE_ANON_KEY` in `.env`
   - Make sure there are no extra spaces or quotes

2. **"Failed to fetch" Error**
   - Verify your `VITE_SUPABASE_URL` is correct
   - Check if your Supabase project is active

3. **Database Connection Issues**
   - Ensure all tables were created successfully
   - Check if RLS policies are enabled

4. **Storage Upload Fails**
   - Verify the `uploads` bucket exists and is public
   - Check storage policies are configured correctly

5. **Build Errors**
   - Run `npm run build` to check for any remaining issues
   - All Firebase references should be removed

### Getting Help:
- Check Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Supabase Discord community: [https://discord.supabase.com](https://discord.supabase.com)

## 🎉 Success!

If all tests pass, congratulations! Your FarmTech application is now running on Supabase with:

- ✅ PostgreSQL database with proper relationships
- ✅ Row Level Security for data protection
- ✅ Real-time subscriptions for live updates
- ✅ Secure file storage
- ✅ Scalable authentication system

Your application is now ready for production deployment! 🚀

## 📊 Database Schema Overview

Your Supabase database includes:

- **users**: User profiles and authentication
- **uploads**: Crop images and support requests  
- **schemes**: Government programs and subsidies
- **contacts**: Agricultural expert information
- **pesticides**: Treatment and product data
- **stats**: Application usage statistics

All tables have appropriate RLS policies ensuring farmers can only access their own data while admins have full access.