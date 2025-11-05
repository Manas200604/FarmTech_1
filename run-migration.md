# Database Migration Instructions

## Step 1: Run the SQL Migration

1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy the contents of `supabase-migration.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

## Step 2: Verify the Migration

After running the migration, verify these changes:

### Tables Updated:
- ✅ `uploads` table has new columns: `file_path`, `file_size`, `file_type`, `public_url`, `storage_path`, `notes`, `reviewed_at`, `reviewed_by`
- ✅ `admin_credentials` table created for environment-based admin auth
- ✅ `analytics_events` table created for tracking

### Storage:
- ✅ `uploads` bucket created and configured as public
- ✅ Storage policies set up for authenticated users

### Functions:
- ✅ `verify_admin_credentials()` function created
- ✅ `get_upload_stats()` function created

## Step 3: Test the System

1. **Test Admin Login:**
   - Go to `/admin-login`
   - Username: `admin`
   - Password: `FarmTech@2024!`

2. **Test File Upload:**
   - Login as a regular user
   - Try uploading an image
   - Check that it appears in Supabase Storage

3. **Test Admin Dashboard:**
   - Login as admin
   - Check that uploads are visible
   - Try reviewing an upload

## Troubleshooting

### If admin login fails:
- Check that `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD` are set in your `.env`
- Verify the admin credentials were inserted into the database

### If uploads fail:
- Check that the `uploads` bucket exists in Supabase Storage
- Verify storage policies are correctly set
- Check browser console for specific error messages

### If images don't display:
- Ensure the `uploads` bucket is set to public
- Check that `public_url` field is being populated correctly

## Environment Variables Required

Make sure these are set in your `.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Storage
VITE_SUPABASE_STORAGE_BUCKET=uploads

# Admin Authentication
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=FarmTech@2024!
```