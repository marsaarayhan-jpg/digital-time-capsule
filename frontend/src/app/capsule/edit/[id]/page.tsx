"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { getCapsuleLockStatus } from "@/lib/capsuleUtils";
import { toast } from "sonner";

import { encryptMessage, decryptMessage } from "@/lib/encryptionUtils";

export default function EditCapsule({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    receiverEmail: "",
    openDate: "",
  });

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Fetch existing capsule data
      const { data: capsule, error: fetchError } = await supabase
        .from("capsules")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !capsule) {
        setError("Capsule not found or access denied.");
        setLoading(false);
        return;
      }

      // Check if user is the sender
      if (capsule.sender_id !== session.user.id) {
        setError("You do not have permission to edit this capsule.");
        setLoading(false);
        return;
      }

      // Check if capsule is still locked
      if (getCapsuleLockStatus(capsule.open_date) === "unlocked") {
        setError("Unsealed capsules cannot be edited.");
        setLoading(false);
        return;
      }

      // DEKRIPSI PESAN UNTUK DITAMPILKAN DI FORM
      setFormData({
        title: capsule.title,
        message: decryptMessage(capsule.message),
        receiverEmail: capsule.receiver_email,
        openDate: capsule.open_date,
      });
      setLoading(false);
    };

    checkUserAndFetchData();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const selectedDate = new Date(formData.openDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setError("The open date must be in the future.");
      setSaving(false);
      return;
    }

    // ENKRIPSI PESAN SEBELUM UPDATE
    const encryptedMessage = encryptMessage(formData.message);

    const { error: updateError } = await supabase
      .from("capsules")
      .update({
        title: formData.title,
        message: encryptedMessage,
        receiver_email: formData.receiverEmail,
        open_date: formData.openDate,
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
    } else {
      toast.success("Capsule Updated", {
        description: "The memory has been reshaped and resealed.",
      });
      router.push("/dashboard");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#1f1612]">
        <div className="w-8 h-8 border border-gold/30 animate-spin border-t-gold" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1f1612] relative overflow-hidden">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-36 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-gold/50" />
              <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-terracotta/80">Update Capsule</span>
            </div>
            <h1 className="font-serif font-light text-5xl md:text-6xl text-parchment mb-4">Edit Memory</h1>
          </div>

          {error && (
            <div className="mb-8 p-4 border border-terracotta/30 bg-terracotta/5 text-terracotta font-sans text-xs tracking-wide">
              {error}
            </div>
          )}

          {!error && (
            <form onSubmit={handleSubmit} className="space-y-10">
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
                    className="w-full bg-black/20 border border-parchment/10 focus:border-terracotta outline-none px-5 py-4 font-serif text-xl text-parchment"
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
                    className="w-full bg-black/20 border border-parchment/10 focus:border-terracotta outline-none px-5 py-4 font-sans text-sm text-parchment"
                  />
                </div>
              </div>

              <div>
                <label className="block font-sans text-[10px] uppercase tracking-[0.25em] text-parchment/60 mb-3">
                  The Message
                </label>
                <textarea
                  required
                  rows={10}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-black/20 border border-parchment/10 focus:border-terracotta outline-none px-6 py-5 font-serif text-xl leading-relaxed text-parchment resize-none"
                />
              </div>

              <div className="border border-parchment/10 bg-black/20 p-8">
                <label className="font-sans text-[10px] uppercase tracking-[0.3em] text-terracotta/90 block mb-5">
                  Unlock Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.openDate}
                  onChange={(e) => setFormData({ ...formData, openDate: e.target.value })}
                  className="w-full bg-black/40 border border-parchment/20 focus:border-gold outline-none px-5 py-4 font-sans text-parchment text-sm [color-scheme:dark]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gold text-espresso py-5 font-sans text-xs uppercase tracking-[0.3em] font-bold hover:bg-terracotta hover:text-parchment transition-all"
              >
                {saving ? "Updating Capsule..." : "Save Changes →"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  );
}
