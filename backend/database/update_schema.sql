-- ==========================================
-- UPDATE SCHEMA: FIX RECEIVER ACCESS & LINKING
-- Jalankan kode ini di SQL Editor Supabase
-- ==========================================

-- 1. PEMBARUAN POLICY RLS (Agar bisa akses lewat Email)

-- Policy Capsules: View
DROP POLICY IF EXISTS "Users can view their own sent or received capsules" ON capsules;
CREATE POLICY "Users can view their own sent or received capsules"
ON capsules FOR SELECT
USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    (auth.jwt() ->> 'email') = receiver_email
);

-- Policy Capsules: Update (Hanya Sender)
DROP POLICY IF EXISTS "Users can update their sent or received capsules" ON capsules;
CREATE POLICY "Users can update their sent or received capsules"
ON capsules FOR UPDATE
USING ( auth.uid() = sender_id )
WITH CHECK ( auth.uid() = sender_id );

-- Policy Capsules: Delete (Hanya Sender)
DROP POLICY IF EXISTS "Users can delete their own capsules" ON capsules;
CREATE POLICY "Users can delete their own capsules"
ON capsules FOR DELETE
USING ( auth.uid() = sender_id );

-- Policy Comments: View
DROP POLICY IF EXISTS "Users can read comments on accessible capsules" ON comments;
CREATE POLICY "Users can read comments on accessible capsules"
ON comments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM capsules 
        WHERE capsules.id = comments.capsule_id 
        AND (
            capsules.sender_id = auth.uid() OR 
            capsules.receiver_id = auth.uid() OR 
            capsules.receiver_email = (auth.jwt() ->> 'email')
        )
    )
);

-- Policy Comments: Insert
DROP POLICY IF EXISTS "Users can add comments to their capsules" ON comments;
CREATE POLICY "Users can add comments to their capsules"
ON comments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM capsules 
        WHERE capsules.id = comments.capsule_id 
        AND (
            capsules.sender_id = auth.uid() OR 
            capsules.receiver_id = auth.uid() OR 
            capsules.receiver_email = (auth.jwt() ->> 'email')
        )
    ) AND auth.uid() = user_id
);


-- 2. LOGIKA OTOMATISASI LINKING RECEIVER

-- A. Trigger saat Capsule Dibuat (Cek jika user sudah ada)
CREATE OR REPLACE FUNCTION public.set_receiver_id_on_insert() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receiver_id IS NULL THEN
    -- Cari ID user di auth.users berdasarkan email
    SELECT id INTO NEW.receiver_id 
    FROM auth.users 
    WHERE email = NEW.receiver_email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_capsule_inserted ON public.capsules;
CREATE TRIGGER on_capsule_inserted
  BEFORE INSERT ON public.capsules
  FOR EACH ROW EXECUTE PROCEDURE public.set_receiver_id_on_insert();


-- B. Trigger saat User Baru Mendaftar (Kaitkan capsule lama)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.capsules
  SET receiver_id = NEW.id
  WHERE receiver_email = NEW.email
  AND receiver_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pastikan trigger ini aktif pada tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
