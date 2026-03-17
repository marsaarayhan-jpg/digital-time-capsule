/**
 * 9 & 10. Supabase Edge Function & Scheduled Capsule Check (Cron Job)
 * 
 * Di environment Edge Function (Deno backend Supabase), file ini idealnya
 * berada di dalam root projct `supabase/functions/check-capsules/index.ts`.
 * Disini saya buatkan simulasi code JS yang bisa di deploy kesana.
 */

// Dalam Edge function Deno, biasanya import tidak menggunakan library npm `supabase-js` biasa, 
// melainkan URL skypack atau esm.sh:
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge function mendengarkan request masuk
// Ini berguna kalau Anda menghubungkannya dengan alat seperti pg_cron atau GitHub Actions Schedule
Deno.serve(async (req) => {
    // Gunakan SUPABASE_SERVICE_ROLE_KEY! Ini mode admin-level untuk Edge Functions
    // Sangat berguna utuk mem-bypass Row Level Security.
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

        // MENGAMBIL CAPSULE YANG SIAP DIBUKA NAMUN BELUM DIKABARI NOTIF-NYA
        const { data: capsules, error } = await supabaseAdmin
            .from('capsules')
            .select('*')
            .eq('notified', false)
            .lte('open_date', todayStr);

        if (error) throw new Error(error.message);

        if (!capsules || capsules.length === 0) {
            return new Response(JSON.stringify({ message: "No capsules ready today" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        console.log(`HARI INI: ${capsules.length} kapsul sudah bisa dibuka.`);

        for (const cap of capsules) {
             // 1. Eksekusi Notifikasi via Resend API
             if (RESEND_API_KEY) {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: 'Capsule Reminder <onboarding@resend.dev>',
                        to: [cap.receiver_email],
                        subject: `Kapsul Waktu Anda Terbuka: ${cap.title}`,
                        html: `<p>Halo, Kapsul waktu "<strong>${cap.title}</strong>" sudah bisa dibuka sekarang! Silakan cek dashboard Anda.</p>`
                    }),
                });
                console.log(`>> [EMAIL TERKIRIM]: ${cap.receiver_email}`);
             } else {
                console.log(`>> [SIMULASI]: ${cap.receiver_email} -> Kapsul "${cap.title}" terbuka.`);
             }

             // 2. Tandai kapsul ini sudah notified agar besok tidak dapat email lagi
             const { error: updateError } = await supabaseAdmin
                .from('capsules')
                .update({ notified: true })
                .eq('id', cap.id);

             if (updateError) {
                 console.error(`[ERROR] Gagal update notified status untuk capsule ${cap.id}: ${updateError.message}`);
             }
        }

        return new Response(JSON.stringify({ 
            message: `Sukses memproses notifikasi ${capsules.length} capsule.` 
        }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});
