/**
 * 13. Daftar Contoh Query Supabase untuk Mahasiswa belajar referensi sintaksis JS SDK.
 */

/* 
 * 13.1 Insert Capsule
 */
const { data: capsule, error: insertError } = await supabase
  .from('capsules')
  .insert([
    { title: 'Dear Future Me...', message: 'Halo!', receiver_email: 'johndoe@email.com', sender_id: 'uuid-kamu', open_date: '2025-10-10' }
  ]);

/* 
 * 13.2 Select Capsule by Sender
 */
const { data: sentCapsules, error: err1 } = await supabase
  .from('capsules')
  .select('*')
  .eq('sender_id', 'id-user-kamu-disini');

/*
 * 13.3 Select Capsule by Receiver 
 */
const { data: receivedCapsules, error: err2 } = await supabase
  .from('capsules')
  .select('*')
  .eq('receiver_id', 'id-user-kamu-disini');

/*
 * 13.4 Select Capsule by ID
 */
const { data: singleCapsule, error: err3 } = await supabase
  .from('capsules')
  .select('*, comments(*)') // sekalian join data comments
  .eq('id', 'capsule-uuid-disini')
  .single();

/*
 * 13.5 Insert Comment
 */
const { data: newComment, error: err4 } = await supabase
  .from('comments')
  .insert([
    { capsule_id: 'capsule-uuid-disini', user_id: 'user-uuid', comment: 'Wah aku udh bisa baca pesannya!' }
  ]);

/*
 * 13.6 Select Comments by Capsule ID
 */
const { data: comments, error: err5 } = await supabase
  .from('comments')
  .select('id, comment, created_at, user_id')
  .eq('capsule_id', 'capsule-uuid-disini')
  .order('created_at', { ascending: true }); // Ascending: tertua ke terbaru

/*
 * 13.7 Update Notified Flag
 */
const { data: updated, error: err6 } = await supabase
  .from('capsules')
  .update({ notified: true })
  .eq('id', 'capsule-uuid-disini'); 
