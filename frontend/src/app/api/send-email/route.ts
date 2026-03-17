import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Tandai route ini sebagai dynamic agar Vercel tidak mencoba me-render secara statis saat build
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

// 1. Setup Rate Limiting (Upstash Redis)
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const ratelimit = redis 
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(1, "60 s"),
    })
  : null;

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Konfigurasi Supabase belum lengkap di server.' }, { status: 500 });
    }

    // Initialize Supabase Admin di dalam handler
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // 2. KEAMANAN: Verifikasi Session User
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1] || (await request.headers.get('x-supabase-auth'));
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token || "");

    if (authError || !user) {
      return NextResponse.json({ error: 'Akses Ditolak: Anda harus login untuk mengirim email.' }, { status: 401 });
    }

    // 3. KEAMANAN: Rate Limiting
    if (ratelimit) {
      const { success, limit, reset, remaining } = await ratelimit.limit(user.id);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Terlalu banyak permintaan. Silakan tunggu 1 menit sebelum mengirim kapsul lagi.' }, 
          { 
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            }
          }
        );
      }
    }

    const { receiverEmail, title, openDate, senderName } = await request.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY belum terkonfigurasi di server.' }, { status: 500 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Digital Time Capsule <noreply@timecapsule.my.id>',
      to: [receiverEmail],
      subject: `Ada Kapsul Waktu untuk Anda: ${title}`,
      html: `
        <div style="font-family: serif; padding: 20px; color: #1f1612; background-color: #fdfaf6; border: 1px solid #e2d1c3;">
          <h1 style="color: #c15e3e; font-weight: 300;">Halo!</h1>
          <p style="font-size: 18px; line-height: 1.6;">
            <strong>${senderName}</strong> baru saja mengirimkan sebuah Kapsul Waktu untuk Anda.
          </p>
          <div style="margin: 30px 0; padding: 20px; background: white; border-left: 4px solid #d4af37;">
            <p style="margin: 0; font-style: italic;">"Kapsul ini berisi pesan yang disegel dan baru bisa dibuka pada tanggal <strong>${openDate}</strong>."</p>
          </div>
          <p style="font-size: 16px;">
            Daftar atau Login ke aplikasi menggunakan email ini (${receiverEmail}) untuk melihatnya di Vault Anda.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2d1c3; margin: 40px 0;" />
          <p style="font-size: 12px; color: #8a7b6f; text-align: center;">
            Dikirim melalui Digital Time Capsule Platform
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Internal Server Error:", err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
