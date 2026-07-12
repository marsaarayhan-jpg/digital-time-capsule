-- Migration: Add 1-way soft delete column (deleted_by_receiver) and update RLS policies

-- 1. Tambahkan kolom deleted_by_receiver ke tabel capsules
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Update Policy SELECT: Receiver hanya bisa melihat kapsul jika deleted_by_receiver = FALSE
DROP POLICY IF EXISTS "Users can view their own sent or received capsules" ON capsules;
CREATE POLICY "Users can view their own sent or received capsules"
ON capsules FOR SELECT
USING (
    auth.uid() = sender_id OR 
    (
        (auth.uid() = receiver_id OR (auth.jwt() ->> 'email') = receiver_email)
        AND deleted_by_receiver = FALSE
    )
);

-- 3. Update Policy UPDATE: Receiver dibolehkan meng-update tabel capsules (untuk mengubah status deleted_by_receiver = TRUE)
DROP POLICY IF EXISTS "Users can update their sent or received capsules" ON capsules;
CREATE POLICY "Users can update their sent or received capsules"
ON capsules FOR UPDATE
USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    (auth.jwt() ->> 'email') = receiver_email
)
WITH CHECK (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    (auth.jwt() ->> 'email') = receiver_email
);
