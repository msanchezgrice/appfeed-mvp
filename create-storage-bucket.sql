-- Create storage bucket for app images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-images',
  'app-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY IF NOT EXISTS "Public Access for App Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-images');

-- Create policy for authenticated users to upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-images');

-- Create policy for service role to manage
CREATE POLICY IF NOT EXISTS "Service role can manage"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'app-images');
