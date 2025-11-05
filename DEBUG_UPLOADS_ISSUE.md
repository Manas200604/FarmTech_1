# Debug: Why Uploads Aren't Showing

## 🔍 **Issue Analysis:**

The admin panel shows "No uploads found" and logs show "Loaded from Supabase: 0 uploads", but you mentioned uploads are already present.

## 🚨 **Most Likely Cause: Database Migration Not Run**

The upload system was recently migrated from Cloudinary to Supabase Storage, and the database schema needs to be updated.

## ✅ **Immediate Solution:**

### **Step 1: Run Database Migration**

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Go to your project**: `jemswvemfjxykvwddozx`
3. **Click SQL Editor** (left sidebar)
4. **Run this diagnostic query first**:

```sql
-- Check current uploads table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'uploads' AND table_schema = 'public'
ORDER BY ordinal_position;
```

### **Step 2: Check for Existing Data**

```sql
-- Check if there are any uploads in the table
SELECT COUNT(*) as total_uploads FROM public.uploads;

-- Check the first few records to see the structure
SELECT * FROM public.uploads LIMIT 5;
```

### **Step 3: Run the Full Migration**

If the table structure is missing the new columns, run this migration:

```sql
-- Add missing columns for Supabase Storage
ALTER TABLE public.uploads 
ADD COLUMN IF NOT EXISTS file_name text,
ADD COLUMN IF NOT EXISTS file_path text,
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS file_type text,
ADD COLUMN IF NOT EXISTS public_url text,
ADD COLUMN IF NOT EXISTS storage_path text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Update existing description to notes
UPDATE public.uploads SET notes = description WHERE notes IS NULL AND description IS NOT NULL;

-- Enable RLS
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own uploads" ON public.uploads;
CREATE POLICY "Users can view own uploads" ON public.uploads 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own uploads" ON public.uploads;
CREATE POLICY "Users can insert own uploads" ON public.uploads 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all uploads" ON public.uploads;
CREATE POLICY "Admins can view all uploads" ON public.uploads 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    )
);
```

## 🔧 **Alternative Debugging:**

### **Check RLS Policies:**
If the migration was run but you still see 0 uploads, the issue might be Row Level Security blocking admin access.

```sql
-- Temporarily disable RLS to test
ALTER TABLE public.uploads DISABLE ROW LEVEL SECURITY;

-- Check if uploads are visible now
SELECT COUNT(*) FROM public.uploads;

-- Re-enable RLS after testing
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
```

### **Check Admin Profile:**
```sql
-- Verify admin profile exists
SELECT * FROM public.profiles WHERE email = 'admin@farmtech.com';

-- If no profile exists, create one
INSERT INTO public.profiles (id, email, name, role, is_admin) 
VALUES (
    'admin-env-user'::uuid, 
    'admin@farmtech.com', 
    'System Administrator', 
    'admin', 
    true
) ON CONFLICT (id) DO UPDATE SET is_admin = true;
```

## 📊 **Expected Results:**

After running the migration:
- ✅ Uploads table will have all required columns
- ✅ Existing uploads will be visible in admin panel
- ✅ New uploads will work with Supabase Storage
- ✅ Admin can see and manage all uploads

## 🎯 **Quick Test:**

After migration, refresh the admin panel and check:
1. Upload Management tab should show existing uploads
2. Try uploading a new file as a farmer
3. Verify it appears in admin panel immediately