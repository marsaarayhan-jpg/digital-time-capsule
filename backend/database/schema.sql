-- 2. Database Design & 3. SQL Schema

-- Aktifkan ekstensi uuid-ossp (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Membuat Tabel capsules
CREATE TABLE capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sender_id UUID NOT NULL,
    receiver_email TEXT NOT NULL,
    receiver_id UUID,
    open_date DATE NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Membuat Tabel comments beserta Foreign Key
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capsule_id UUID NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Row Level Security (Keamanan Basis Data)

-- Aktifkan sistem RLS pada kedua tabel
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy untuk Capsules (SELECT): Data dapat dilihat jika user adalah sender, receiver_id cocok, atau email cocok
DROP POLICY IF EXISTS "Users can view their own sent or received capsules" ON capsules;
CREATE POLICY "Users can view their own sent or received capsules"
ON capsules FOR SELECT
USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    (auth.jwt() ->> 'email') = receiver_email
);

-- Policy untuk Capsules (INSERT): User yang membuat data kapsul harus menyimpan id-nya sebagai sender_id
CREATE POLICY "Users can create capsules"
ON capsules FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
);

-- Policy untuk Capsules (UPDATE): Hanya Sender yang boleh mengubah, dan JARANG boleh jika sudah terbuka (opsional, untuk keamanan ketat)
DROP POLICY IF EXISTS "Users can update their sent or received capsules" ON capsules;
CREATE POLICY "Users can update their sent or received capsules"
ON capsules FOR UPDATE
USING (
    auth.uid() = sender_id
)
WITH CHECK (
    auth.uid() = sender_id
);

-- Policy untuk Capsules (DELETE): Hanya Sender yang boleh menghapus kapsulnya
CREATE POLICY "Users can delete their own capsules"
ON capsules FOR DELETE
USING (
    auth.uid() = sender_id
);

-- Policy untuk Comments (SELECT): Bisa dilihat jika parent capsulenya bisa diakses
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

-- Policy untuk Comments (INSERT): Hanya yang bisa melihat kapsul yang bisa mengisi komentar
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

-- 6. Receiver Handling Logic

-- A. Saat capsule dibuat, cek apakah email penerima sudah terdaftar
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

CREATE TRIGGER on_capsule_inserted
  BEFORE INSERT ON public.capsules
  FOR EACH ROW EXECUTE PROCEDURE public.set_receiver_id_on_insert();

-- B. Saat ada user baru mendaftar (untuk yang belum pernah dikirimi capsule)
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

-- Trigger pada Auth Supabase ketika user baru ditambahkan
-- Catatan: Jalankan perintah ini di SQL Editor Supabase secara manual jika belum aktif
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
