-- Migration: Add photo_url column to existing capsules table
-- Run this in Supabase SQL Editor if your table already exists

ALTER TABLE capsules ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ============================================================
-- STORAGE BUCKET SETUP
-- Run these policies AFTER manually creating the 'capsule-photos'
-- bucket in Supabase Dashboard → Storage → New Bucket (set to Public)
-- ============================================================

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload capsule photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'capsule-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Anyone can view capsule photos (public read)
CREATE POLICY "Anyone can view capsule photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'capsule-photos');

-- Policy: Users can delete their own capsule photos
CREATE POLICY "Users can delete their own capsule photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'capsule-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own capsule photos
CREATE POLICY "Users can update their own capsule photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'capsule-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
