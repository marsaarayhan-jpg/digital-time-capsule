import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Hanya throw error di sisi client (browser) atau jika benar-benar dibutuhkan saat runtime
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Warning: Missing Supabase environment variables. Ini normal saat proses build di Vercel jika belum dikonfigurasi."
  );
}

// Kita biarkan inisialisasi meskipun kosong agar build tidak crash, 
// nanti akan error di runtime jika variabel benar-benar tidak ada di Vercel.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseKey || 'placeholder-key'
);
