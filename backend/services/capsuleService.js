import { supabase } from '../lib/supabaseClient.js';

/**
 * 7. Capsule Lock Logic
 * Berfungsi memvalidasi apakah capsule saat ini berada pada kondisi bisa dibuka.
 * @param {string} openDateFormat string - Format tgl dari db 'YYYY-MM-DD'
 * @returns {string} - Status 'locked' atau 'unlocked'
 */
export const checkCapsuleLockStatus = (openDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset jam ke 00:00 hari ini untuk kalkulasi tgl

    const unlockDate = new Date(openDate);
    unlockDate.setHours(0, 0, 0, 0);

    return (today < unlockDate) ? 'locked' : 'unlocked';
};

/**
 * 5. Create Capsule & 8. Email Notification 
 * Fungsi ini membuat capsule ke database, lalu mensimulasikan notif.
 */
export async function createCapsule(title, message, receiverEmail, openDate) {
    // 1. Dapatkan auth session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) throw new Error("Akses Ditolak: User Belum Login.");

    // 2. Insert capsule record
    const { data, error } = await supabase
        .from('capsules')
        .insert([{
            title,
            message,
            receiver_email: receiverEmail,
            open_date: openDate,
            sender_id: user.id
            // receiver_id sementara null (menunggu handling handle_new_user)
        }])
        .select('*')
        .single();

    if (error) throw new Error(`Insert failed: ${error.message}`);

    // 3. Email Notification menggunakan integrasi eksternal misal Resend
    console.log(`[MAIL-SENDER] Notifikasi dikirimkan ke: ${receiverEmail}`);
    console.log(`[MAIL-SENDER] Pesan: Ada capsule "${title}" menunggumu di masa depan tanggal ${openDate}.`);

    return data;
}

/**
 * 5. Get My Sent Capsules
 */
export async function getMySentCapsules() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) throw new Error("Akses Ditolak: User Belum Login.");

    const { data, error } = await supabase
        .from('capsules')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * 5. Get My Received Capsules
 */
export async function getMyReceivedCapsules() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) throw new Error("Akses Ditolak: User Belum Login.");

    const { data, error } = await supabase
        .from('capsules')
        .select('*')
        // Kombinasi email DAN receiver_id agar capsule lama (sebelum registrasi) tetap muncul
        .or(`receiver_email.eq.${user.email},receiver_id.eq.${user.id}`);

    if (error) throw new Error(error.message);
    
    // Terapkan Logika Mute pesan ketika locked.
    return data.map(capsule => {
        const lockStatus = checkCapsuleLockStatus(capsule.open_date);
        
        if (lockStatus === 'locked') {
             capsule.message = "Rahasia! Capsule ini masih terkunci.";
        }
        
        capsule.status = lockStatus; // Tempelkan statusnya
        return capsule;
    });
}

/**
 * 5. Get Capsule By ID
 */
export async function getCapsuleById(capsuleId) {
    // Security by Supabase RLS sudah jalan, tidak perlu manual filter permission di DB Query
    const { data, error } = await supabase
        .from('capsules')
        .select('*')
        .eq('id', capsuleId)
        .single();

    if (error) throw new Error(`Data tidak ditemukan / Akses Ditolak: ${error.message}`);

    const lockStatus = checkCapsuleLockStatus(data.open_date);
    if (lockStatus === 'locked') {
        data.message = "Rahasia! Capsule ini masih terkunci.";
    }
    
    data.status = lockStatus;
    return data;
}
