"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCapsuleLockStatus } from "@/lib/capsuleUtils";
import type { Capsule } from "@/lib/types";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import CapsuleCard from "@/components/CapsuleCard";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import { decryptMessage } from "@/lib/encryptionUtils";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [receivedCapsules, setReceivedCapsules] = useState<Capsule[]>([]);
  const [sentCapsules, setSentCapsules] = useState<Capsule[]>([]);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionAndData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      // Fetch received capsules — by email ATAU by receiver_id (untuk capsule lama sebelum registrasi)
      const { data: received } = await supabase
        .from("capsules")
        .select("*")
        .or(`receiver_email.eq.${session.user.email},receiver_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false });

      // Fetch sent capsules
      const { data: sent } = await supabase
        .from("capsules")
        .select("*")
        .eq("sender_id", session.user.id)
        .order("created_at", { ascending: false });

      setReceivedCapsules(received || []);
      setSentCapsules(sent || []);
      setLoading(false);
    };

    fetchSessionAndData();
  }, [router]);

  // Fix #8: Gunakan utility function dari capsuleUtils (menggantikan inline logic duplikat)
  const getStatus = (openDate: string) => getCapsuleLockStatus(openDate);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;

    const { error } = await supabase.from("capsules").delete().eq("id", idToDelete);

    if (error) {
      toast.error("Failed to delete capsule", {
        description: error.message
      });
    } else {
      setSentCapsules((prev) => prev.filter((cap) => cap.id !== idToDelete));
      setReceivedCapsules((prev) => prev.filter((cap) => cap.id !== idToDelete));
      toast.success("Capsule Deleted", {
        description: "The memory has been removed from the vault."
      });
    }
    setIsDeleteModalOpen(false);
    setIdToDelete(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#1f1612]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border border-gold/30 animate-spin border-t-gold" />
          <span className="font-serif text-2xl text-parchment/50 animate-pulse">Loading memories...</span>
        </div>
      </main>
    );
  }

  const displayCapsules = activeTab === "received" ? receivedCapsules : sentCapsules;

  return (
    <main className="min-h-screen bg-[#1f1612] relative">
      <Navbar />

      {/* Background accent */}
      <div className="absolute top-0 right-0 w-[800px] h-[400px] bg-terracotta/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-36 pb-24 relative z-10">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-gold/50" />
              <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-terracotta/80">Vault</span>
            </div>
            <h1 className="font-serif font-light text-6xl md:text-7xl text-parchment">Your Memories</h1>
            <p className="font-serif italic font-light text-parchment/45 text-xl mt-3">
              {user?.email}
            </p>
          </div>
          <Link
            href="/capsule/create"
            className="flex items-center gap-3 px-7 py-3.5 bg-gold text-espresso font-sans text-xs uppercase font-bold tracking-[0.2em] hover:bg-terracotta hover:text-parchment transition-colors duration-500 self-start md:self-auto whitespace-nowrap"
          >
            <Plus size={14} />
            New Capsule
          </Link>
        </motion.header>

        {/* Tabs */}
        <div className="flex gap-0 mb-14 border-b border-parchment/10">
          {(["received", "sent"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-5 px-1 mr-10 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                activeTab === tab ? "text-terracotta font-bold" : "text-parchment/35 hover:text-parchment/70"
              }`}
            >
              {tab === "received"
                ? `Received (${receivedCapsules.length})`
                : `Sent (${sentCapsules.length})`
              }
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-line"
                  className="absolute bottom-0 left-0 right-0 h-px bg-terracotta"
                />
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {displayCapsules.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-32 text-center border border-dashed border-parchment/10 bg-black/10 backdrop-blur-sm"
          >
            <p className="font-serif text-3xl font-light text-parchment/30 mb-6">
              No capsules here yet.
            </p>
            {activeTab === "sent" && (
              <Link
                href="/capsule/create"
                className="font-sans text-xs uppercase tracking-[0.2em] text-terracotta hover:text-gold transition-colors underline underline-offset-4 decoration-terracotta/30"
              >
                Create your first capsule
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCapsules.map((capsule, idx) => (
              <motion.div
                key={capsule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
              >
                <CapsuleCard
                  id={capsule.id}
                  title={activeTab === "received" && getStatus(capsule.open_date) === "locked" ? "Secret Capsule" : decryptMessage(capsule.title)}
                  openDate={capsule.open_date}
                  status={getStatus(capsule.open_date)}
                  type={activeTab}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Destroy Memory?"
        message="Are you sure you want to delete this capsule? This action is permanent and cannot be undone."
        confirmText="Destroy Forever"
        cancelText="Keep Memory"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDestructive={true}
      />
    </main>
  );
}
