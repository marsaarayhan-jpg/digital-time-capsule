-- Migration: Add 1-way soft delete column (deleted_by_receiver) and update RLS policies

-- 1. Tambahkan kolom deleted_by_receiver ke tabel capsules
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Update Policy SELECT: Sender dan Receiver diperbolehkan membaca row (Filter deleted_by_receiver dihandle secara eksplisit oleh query frontend)
DROP POLICY IF EXISTS "Users can view their own sent or received capsules" ON capsules;
CREATE POLICY "Users can view their own sent or received capsules"
ON capsules FOR SELECT
USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    LOWER(auth.jwt() ->> 'email') = LOWER(receiver_email)
);

-- 3. Update Policy UPDATE: Receiver dibolehkan meng-update tabel capsules (agar bisa mengubah status deleted_by_receiver = TRUE tanpa pelanggaran RLS)
DROP POLICY IF EXISTS "Users can update their sent or received capsules" ON capsules;
CREATE POLICY "Users can update their sent or received capsules"
ON capsules FOR UPDATE
USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    LOWER(auth.jwt() ->> 'email') = LOWER(receiver_email)
)
WITH CHECK (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    LOWER(auth.jwt() ->> 'email') = LOWER(receiver_email)
);
