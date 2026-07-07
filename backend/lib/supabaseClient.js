import { createClient } from '@supabase/supabase-js';

// Setup key Supabase dari environment variables (.env) agar aman.
const supabaseUrl = process.env.SUPABASE_URL; // e.g., 'https://xyzcompany.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY; 

/**
 * 1. Authentication & Config Initialization
 * Disini kita membuat instance Supabase Client yang nantinya
 * dapat dipakai secara global ke seluruh file logic kita.
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
