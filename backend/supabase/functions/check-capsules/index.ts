import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // 1. Inisialisasi Admin Client (Gunakan Service Role Key agar bisa bypass RLS)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    // 2. Cari Kapsul yang SUDAH sampai tanggal buka dan BELUM pernah dikirimi notifikasi
    const { data: capsules, error } = await supabaseAdmin
      .from('capsules')
      .select('*')
      .eq('notified', false) // Belum pernah dikabari
      .lte('open_date', todayStr); // Tanggal buka <= Hari ini

    if (error) throw new Error(error.message);

    if (!capsules || capsules.length === 0) {
      return new Response(JSON.stringify({ message: "No capsules ready today." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${capsules.length} ready capsules...`);

    // 3. Loop kirim email via Resend
    for (const cap of capsules) {
      if (RESEND_API_KEY) {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Digital Time Capsule <noreply@timecapsule.my.id>',
            to: [cap.receiver_email],
            subject: `Kapsul Waktu Anda Terbuka: ${cap.title}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2>Halo!</h2>
                <p>Kapsul waktu berharga dari <strong>${cap.sender_name || 'Alamat Anda'}</strong> sudah bisa Anda buka sekarang.</p>
                <p>Judul: <strong>${cap.title}</strong></p>
                <p>Silakan kunjungi Vault Anda untuk membacanya.</p>
                <br />
                <a href="https://digital-time-capsule.vercel.app/dashboard" style="background: #c15e3e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Buka Vault Sekarang</a>
              </div>
            `
          }),
        });

        if (emailRes.ok) {
          // 4. Update status agar tidak dikirim lagi besok
          await supabaseAdmin
            .from('capsules')
            .update({ notified: true })
            .eq('id', cap.id);
          
          console.log(`Successfully notified: ${cap.receiver_email}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: capsules.length }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
