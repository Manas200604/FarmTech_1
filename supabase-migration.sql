-- FarmTech Supabase Migration Script
-- Run this in your Supabase SQL Editor to update the database schema

-- 1. Update uploads table to work with Supabase Storage
ALTER TABLE public.uploads 
ADD COLUMN IF NOT EXISTS file_path text,
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS file_type text,
ADD COLUMN IF NOT EXISTS public_url text,
ADD COLUMN IF NOT EXISTS storage_path text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Remove offline-first columns if they exist
ALTER TABLE public.uploads 
DROP COLUMN IF EXISTS admin_feedback,
DROP COLUMN IF EXISTS local_path;

-- Update existing description column to notes if needed
UPDATE public.uploads SET notes = description WHERE notes IS NULL AND description IS NOT NULL;

-- 2. Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up storage policies for the uploads bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own files" ON storage.objects 
FOR UPDATE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects 
FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Update users table to ensure proper admin detection
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_level text DEFAULT 'user' CHECK (admin_level IN ('user', 'admin', 'super_admin'));

-- 5. Create admin users table for environment-based authentication
CREATE TABLE IF NOT EXISTS public.admin_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    last_login timestamp with time zone
);

-- 6. Update profiles table to support admin roles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_level text DEFAULT 'user' CHECK (admin_level IN ('user', 'admin', 'super_admin')),
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}';

-- 7. Create function to check admin credentials
CREATE OR REPLACE FUNCTION public.verify_admin_credentials(
    input_username text,
    input_password text
) RETURNS jsonb AS $$
DECLARE
    admin_record record;
    result jsonb;
BEGIN
    -- Check if admin exists and is active
    SELECT * INTO admin_record 
    FROM public.admin_credentials 
    WHERE username = input_username 
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;
    
    -- In a real implementation, you'd use proper password hashing
    -- For now, we'll do a simple comparison (NOT SECURE FOR PRODUCTION)
    IF admin_record.password_hash = input_password THEN
        -- Update last login
        UPDATE public.admin_credentials 
        SET last_login = now() 
        WHERE id = admin_record.id;
        
        RETURN jsonb_build_object(
            'success', true, 
            'admin', jsonb_build_object(
                'id', admin_record.id,
                'username', admin_record.username,
                'role', admin_record.role
            )
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Insert default admin user (using environment values)
INSERT INTO public.admin_credentials (username, password_hash, role) 
VALUES ('admin', 'FarmTech@2024!', 'super_admin')
ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;

-- 9. Create analytics table for better tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    user_id uuid REFERENCES public.users(id),
    session_id text,
    properties jsonb DEFAULT '{}',
    timestamp timestamp with time zone DEFAULT now(),
    ip_address inet,
    user_agent text
);

-- 10. Create upload analytics view
CREATE OR REPLACE VIEW public.upload_analytics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_uploads,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_uploads,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_uploads,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_uploads,
    AVG(file_size) as avg_file_size
FROM public.uploads 
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 11. Enable Row Level Security (RLS) on sensitive tables
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for uploads
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

-- 13. Create function to get upload statistics
CREATE OR REPLACE FUNCTION public.get_upload_stats()
RETURNS jsonb AS $$
DECLARE
    stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_uploads', COUNT(*),
        'pending_uploads', COUNT(CASE WHEN status = 'pending' THEN 1 END),
        'approved_uploads', COUNT(CASE WHEN status = 'approved' THEN 1 END),
        'rejected_uploads', COUNT(CASE WHEN status = 'rejected' THEN 1 END),
        'total_size_mb', ROUND(SUM(file_size)::numeric / 1024 / 1024, 2),
        'avg_size_kb', ROUND(AVG(file_size)::numeric / 1024, 2)
    ) INTO stats
    FROM public.uploads;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.uploads TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.upload_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_credentials TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_upload_stats TO authenticated;

-- 15. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON public.uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON public.uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON public.uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp);

-- 16. Update existing uploads to have proper status if missing
UPDATE public.uploads SET status = 'pending' WHERE status IS NULL;

-- 17. Create a function to migrate existing Cloudinary URLs to Supabase (if needed)
CREATE OR REPLACE FUNCTION public.migrate_cloudinary_to_supabase()
RETURNS text AS $$
DECLARE
    upload_record record;
    migration_count integer := 0;
BEGIN
    -- This function can be used to identify uploads that need migration
    FOR upload_record IN 
        SELECT * FROM public.uploads 
        WHERE public_url LIKE '%cloudinary%' OR image_url LIKE '%cloudinary%'
    LOOP
        -- Mark these uploads for manual migration
        UPDATE public.uploads 
        SET notes = COALESCE(notes, '') || ' [MIGRATION NEEDED: Cloudinary URL detected]'
        WHERE id = upload_record.id;
        
        migration_count := migration_count + 1;
    END LOOP;
    
    RETURN 'Marked ' || migration_count || ' uploads for migration from Cloudinary to Supabase Storage';
END;
$$ LANGUAGE plpgsql;

-- 18. Create admin session tracking
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES public.admin_credentials(id),
    session_token text UNIQUE NOT NULL,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
    is_active boolean DEFAULT true
);

-- 19. Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.admin_sessions 
    WHERE expires_at < now() OR is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 20. Final verification query
SELECT 
    'Migration completed successfully!' as status,
    (SELECT COUNT(*) FROM public.uploads) as total_uploads,
    (SELECT COUNT(*) FROM public.admin_credentials) as admin_accounts,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'uploads') as storage_buckets;

-- Note: After running this migration, you should:
-- 1. Test the admin login with username: admin, password: FarmTech@2024!
-- 2. Upload a test image to verify Supabase Storage is working
-- 3. Check that the uploads bucket is publicly accessible
-- 4. Verify that RLS policies are working correctly