"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { getCapsuleLockStatus } from "@/lib/capsuleUtils";
import type { Capsule, Comment } from "@/lib/types";
import Navbar from "@/components/Navbar";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import { Lock, Unlock, Send } from "lucide-react";
import { decryptMessage } from "@/lib/encryptionUtils";

export default function CapsuleDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    const fetchCapsule = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      const { data: capsuleData, error: capsuleError } = await supabase
        .from("capsules")
        .select("*")
        .eq("id", id)
        .single();

      if (capsuleError || !capsuleData) {
        router.push("/dashboard");
        return;
      }

      // Access control
      const isOwner =
        session.user.id === capsuleData.sender_id ||
        session.user.id === capsuleData.receiver_id ||
        session.user.email === capsuleData.receiver_email;

      if (!isOwner) {
        router.push("/dashboard");
        return;
      }

      // DEKRIPSI PESAN SEBELUM DI-SET KE STATE
      const decryptedData = {
        ...capsuleData,
        message: decryptMessage(capsuleData.message)
      };

      setCapsule(decryptedData);

      // Fix #8: Gunakan utility function dari capsuleUtils
      const isLocked = getCapsuleLockStatus(capsuleData.open_date) === "locked";

      if (!isLocked) {
        const { data: commentsData } = await supabase
          .from("comments")
          .select("*")
          .eq("capsule_id", id)
          .order("created_at", { ascending: true });
        setComments(commentsData || []);
      }

      setLoading(false);
    };

    fetchCapsule();
  }, [id, router]);

  // =============== REALTIME SUBSCRIPTION FOR COMMENTS ===============
  useEffect(() => {
    if (!id) return;

    // Subscribe to changes on the comments table for THIS specific capsule
    const channel = supabase
      .channel(`capsule-comments-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `capsule_id=eq.${id}`,
        },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments((prev) => {
            // Prevent duplicate if the local insert already added it (though we'll refactor submit)
            if (prev.find(c => c.id === newComment.id)) return prev;
            return [...prev, newComment];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    // We don't need to manually update state here anymore 
    // because our Realtime subscription will catch the insert and update the UI!
    const { error } = await supabase
      .from("comments")
      .insert([{ capsule_id: id, user_id: user.id, comment: newComment }]);

    if (!error) {
      setNewComment("");
    } else {
      toast.error("Failed to post reflection");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-parchment">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border border-gold/30 animate-spin border-t-gold" />
          <span className="font-serif text-2xl text-dark-text/40 animate-pulse">Retrieving memory...</span>
        </div>
      </main>
    );
  }

  // Guard: capsule seharusnya sudah di-set jika loading = false, ini untuk TypeScript
  if (!capsule) return null;

  // Fix #8: Gunakan utility function dari capsuleUtils
  const isLocked = getCapsuleLockStatus(capsule.open_date) === "locked";
  const isSender = user?.id === capsule.sender_id;
  const isReceiver = user?.id === capsule.receiver_id || user?.email === capsule.receiver_email;

  return (
    <main className="min-h-screen bg-[#1f1612] relative overflow-hidden">
      <Navbar />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-terracotta/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-36 pb-24 relative z-10">

        {isLocked ? (
          /* ==================== LOCKED ==================== */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center text-center"
          >
            {/* Lock icon */}
            <div className="relative mb-12">
              <div className="w-20 h-20 border border-gold/40 bg-black/40 backdrop-blur-md flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(200,169,110,0.2)]">
                <Lock className="w-8 h-8 text-gold/80" />
              </div>
              <div className="absolute inset-0 border border-gold/30 -m-2 opacity-50" />
              <div className="absolute inset-0 border border-terracotta/20 -m-4 opacity-30" />
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-gold/40" />
              <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-terracotta">Sealed</span>
              <div className="h-px w-12 bg-gold/40" />
            </div>

            <h1 className="font-serif font-light text-5xl md:text-6xl text-parchment mb-5 drop-shadow-lg">
              {isSender ? `"${capsule.title}"` : "Secret Memory"}
            </h1>
            <p className="font-serif italic font-light text-xl text-parchment/60 max-w-md mb-16 leading-relaxed">
              This digital capsule remains cryptographically sealed to preserve its content until the chosen date.
            </p>

            {/* Countdown */}
            <div className="relative w-full max-w-lg">
              <div className="absolute inset-0 border border-gold/20 -m-2 opacity-40 shadow-[0_0_50px_rgba(200,169,110,0.05)]" />
              <div className="border border-gold/30 bg-black/40 backdrop-blur-md p-12 relative">
                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-10 text-center">
                  Time Until Unsealing
                </p>
                <div className="text-parchment">
                  <CountdownTimer targetDate={capsule.open_date} />
                </div>
                <div className="mt-10 text-center">
                  <p className="font-serif italic text-sm text-parchment/40">
                    Opens on {new Date(capsule.open_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Edit Button for Sender */}
            {isSender && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12"
              >
                <Link
                  href={`/capsule/edit/${id}`}
                  className="px-8 py-3 border border-gold/30 text-gold/80 font-sans text-[10px] uppercase tracking-[0.3em] hover:bg-gold/10 transition-all duration-300 flex items-center gap-3"
                >
                   Edit Locked Capsule
                </Link>
              </motion.div>
            )}
          </motion.div>

        ) : (
          /* ==================== UNLOCKED ==================== */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Header */}
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-10">
                <div className="h-px w-12 bg-gold/40" />
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-terracotta" />
                  <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-terracotta">Unsealed</span>
                </div>
                <div className="h-px w-12 bg-gold/40" />
              </div>

              <h1 className="font-serif font-light text-6xl md:text-7xl text-parchment mb-8 leading-tight drop-shadow-md">
                {capsule.title}
              </h1>
              <div className="flex items-center justify-center gap-4 font-sans text-[10px] uppercase tracking-[0.2em] text-parchment/50">
                <span>From: {isSender ? "You" : "Sender"}</span>
                <span className="text-gold/40">·</span>
                <span>To: {isReceiver && !isSender ? "You" : capsule.receiver_email}</span>
                <span className="text-gold/40">·</span>
                <span>{new Date(capsule.open_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>

            {/* Message */}
            <div className="relative mb-24">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-gold/40" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-gold/40" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-gold/40" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-gold/40" />

              <div className="bg-black/40 backdrop-blur-md border border-parchment/10 p-12 md:p-16 mx-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]">
                <p className="font-serif font-light text-xl md:text-2xl leading-[1.9] text-parchment/90 whitespace-pre-wrap">
                  {capsule.message}
                </p>
              </div>
            </div>

            {/* Comments / Reflections */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-px flex-1 bg-parchment/10" />
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-parchment/40">
                  Reflections ({comments.length})
                </span>
                <div className="h-px flex-1 bg-parchment/10" />
              </div>

              {/* Comments List */}
              <div className="space-y-5 mb-10">
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/30 backdrop-blur-sm border border-parchment/10 p-6"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-terracotta/70 bg-terracotta/10 border border-terracotta/20 px-2.5 py-1">
                        {comment.user_id === capsule.sender_id ? "Sender" : "Recipient"}
                      </span>
                      <span className="font-sans text-[10px] text-parchment/40">
                        {new Date(comment.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="font-serif text-lg font-light text-parchment/90 leading-relaxed">{comment.comment}</p>
                  </motion.div>
                ))}
              </div>

              {/* New Comment */}
              <form onSubmit={handleCommentSubmit} className="relative">
                <textarea
                  required
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Leave a reflection..."
                  className="w-full bg-black/40 backdrop-blur-sm border border-parchment/20 focus:border-terracotta outline-none p-5 pr-16 font-serif text-lg text-parchment placeholder:text-parchment/30 resize-none transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute bottom-5 right-5 w-9 h-9 bg-gold text-espresso flex items-center justify-center hover:bg-terracotta hover:text-parchment transition-colors duration-300"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
