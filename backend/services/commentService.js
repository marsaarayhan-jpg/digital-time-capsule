import { supabase } from '../lib/supabaseClient.js';

/**
 * 11. Comment Operations - Create Comment
 */
export async function createComment(capsuleId, commentText) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Akses Ditolak: Belum login.");

    const { data, error } = await supabase
        .from('comments')
        .insert([{
            capsule_id: capsuleId,
            user_id: user.id,
            comment: commentText
        }])
        .select()
        .single();

    if (error) throw new Error(`Gagal Comment: ${error.message}`);
    return data;
}

/**
 * 11. Get Comments By Capsule
 */
export async function getCommentsByCapsule(capsuleId) {
    const { data, error } = await supabase
        .from('comments')
        .select(`id, comment, user_id, created_at`)
        .eq('capsule_id', capsuleId)
        .order('created_at', { ascending: true }); // Data dari komentar tertua -> terbaru

    if (error) throw new Error(`Gagal Load Comments: ${error.message}`);
    return data;
}
