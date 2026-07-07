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
            from: 'Digital Time Capsule <noreply@send.timecapsule.my.id>',
            to: [cap.receiver_email],
            subject: `Kapsul Waktu Anda Terbuka: ${cap.title}`,
            html: `
              <div style="font-family: serif; padding: 20px; color: #1f1612; background-color: #fdfaf6; border: 1px solid #e2d1c3;">
                <h2 style="color: #c15e3e; font-weight: 300;">Halo!</h2>
                <p style="font-size: 16px;">Kapsul waktu berharga dengan judul <strong>"${cap.title}"</strong> sudah bisa Anda buka sekarang.</p>
                <div style="margin: 30px 0;">
                  <a href="https://timecapsule.my.id/capsule/${cap.id}" style="background: #c15e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Lihat Kapsul di Vault</a>
                </div>
                <p style="font-size: 14px; color: #8a7b6f;">Silakan login ke Vault Anda untuk membacanya.</p>
                <hr style="border: 0; border-top: 1px solid #e2d1c3; margin: 40px 0;" />
                <p style="font-size: 12px; color: #8a7b6f; text-align: center;">Digital Time Capsule Platform</p>
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
