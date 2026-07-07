/**
 * Email Service Bridge (Client-side)
 * 
 * Versi ini jauh lebih AMAN karena tidak menggunakan NEXT_PUBLIC_RESEND_API_KEY.
 * API Key hanya disimpan di sisi Server, dan client memanggil Route Handler API.
 */

import { supabase } from "./supabaseClient";

export const sendCapsuleNotification = async (
  receiverEmail: string,
  title: string,
  openDate: string,
  senderName: string = "Seseorang"
) => {
  console.log(`[EMAIL-SERVICE] Memanggil API Route untuk mengirim email ke ${receiverEmail}...`);

  try {
    // Ambil session untuk verifikasi keamanan di server
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || "";

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiverEmail,
        title,
        openDate,
        senderName,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[EMAIL-SERVICE] Gagal mengirim email via API Route:", result.error);
      return { success: false, error: result.error };
    }

    console.log(`[EMAIL-SERVICE] Email berhasil dikirim melalui Server! ID: ${result.data?.id}`);
    return { success: true, data: result.data };
  } catch (err) {
    console.error("[EMAIL-SERVICE] Terjadi kesalahan saat memanggil API:", err);
    return { success: false, error: err };
  }
};
