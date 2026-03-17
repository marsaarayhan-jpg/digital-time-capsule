"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { sendCapsuleNotification } from "@/lib/emailService";
import { toast } from "sonner";

export default function CreateCapsule() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    receiverEmail: "",
    openDate: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) return;

    const selectedDate = new Date(formData.openDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setError("The open date must be in the future.");
      setLoading(false);
      return;
    }

    // Fix #4: Cegah user kirim capsule ke diri sendiri
    if (formData.receiverEmail.toLowerCase() === user.email?.toLowerCase()) {
      setError("You cannot send a capsule to yourself.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("capsules").insert([
      {
        title: formData.title,
        message: formData.message,
        receiver_email: formData.receiverEmail,
        open_date: formData.openDate,
        sender_id: user.id,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      // Kirim Notifikasi Email (Simulasi/Bridge)
      try {
        await sendCapsuleNotification(
          formData.receiverEmail,
          formData.title,
          formData.openDate,
          user.email || "A friend"
        );
      } catch (err) {
        console.error("Failed to send notification email:", err);
        // Kita tidak menghentikan flow jika email gagal, agar capsule tetap tersimpan
      }

      toast.success("Capsule Sealed Successfully", {
        description: "Your memory has been locked in time.",
      });

      setLoading(false); // Fix #11: reset loading state sebelum navigate
      router.push("/dashboard");
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#1f1612] relative overflow-hidden">
      <Navbar />

      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-terracotta/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-36 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Page Header */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-gold/50" />
              <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-terracotta/80">New Capsule</span>
            </div>
            <h1 className="font-serif font-light text-5xl md:text-6xl text-parchment mb-4">Seal a Memory</h1>
            <p className="font-serif italic font-light text-parchment/50 text-xl">
              Write your thoughts, choose a recipient, and set the date when this capsule will unlock.
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 p-4 border border-terracotta/30 bg-terracotta/5 text-terracotta font-sans text-xs tracking-wide"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-[0.25em] text-parchment/60 mb-3">
                  Capsule Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., To My Future Self"
                  className="w-full bg-black/20 border border-parchment/10 focus:border-terracotta focus:bg-black/40 outline-none px-5 py-4 font-serif text-xl text-parchment placeholder:text-parchment/20 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] uppercase tracking-[0.25em] text-parchment/60 mb-3">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.receiverEmail}
                  onChange={(e) => setFormData({ ...formData, receiverEmail: e.target.value })}
                  placeholder="their@email.com"
                  className="w-full bg-black/20 border border-parchment/10 focus:border-terracotta focus:bg-black/40 outline-none px-5 py-4 font-sans text-sm text-parchment placeholder:text-parchment/20 transition-all duration-300"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-[0.25em] text-parchment/60 mb-3">
                The Message
              </label>
              <div className="relative">
                <textarea
                  required
                  rows={10}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Write what's on your mind today..."
                  className="w-full bg-black/20 border border-parchment/10 focus:border-terracotta focus:bg-black/40 outline-none px-6 py-5 font-serif text-xl leading-relaxed text-parchment placeholder:text-parchment/20 transition-all duration-300 resize-none"
                />
                {/* Subtle paper lines effect adapted for dark mode */}
                <div className="absolute inset-x-6 bottom-5 space-y-[1.75rem] pointer-events-none opacity-10">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-px bg-parchment/30" />
                  ))}
                </div>
              </div>
            </div>

            {/* Unlock Date */}
            <div className="border border-parchment/10 bg-black/20 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-6 bg-gold/60" />
                <label className="font-sans text-[10px] uppercase tracking-[0.3em] text-terracotta/90">
                  Unlock Date
                </label>
              </div>
              <input
                type="date"
                required
                value={formData.openDate}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, openDate: e.target.value })}
                className="w-full bg-black/40 border border-parchment/20 focus:border-gold outline-none px-5 py-4 font-sans text-parchment transition-all duration-300 text-sm [color-scheme:dark]"
              />
              <p className="font-serif italic text-sm text-parchment/40 mt-4">
                This capsule will remain sealed until midnight of the date you choose.
              </p>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-espresso py-5 font-sans text-xs uppercase tracking-[0.3em] hover:bg-terracotta hover:text-parchment transition-all duration-500 disabled:opacity-40 font-bold"
              >
                {loading ? "Sealing Capsule..." : "Initialize Capsule →"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
