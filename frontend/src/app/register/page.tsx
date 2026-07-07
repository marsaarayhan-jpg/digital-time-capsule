"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      toast.success("Welcome to the Vault", {
        description: "Your account has been created successfully."
      });
      router.push("/dashboard");
    } else {
      // Email confirmation aktif — tampilkan pesan untuk cek email
      setLoading(false);
      setSuccess("Account created! Please check your email to confirm your account before logging in.");
      toast.success("Account Created", {
        description: "Please check your email to confirm your account."
      });
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center bg-[#1f1612] overflow-hidden">
      <Navbar />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-terracotta/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-10 bg-gold/40" />
              <div className="w-5 h-5 border border-gold/40 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-gold rounded-sm" />
              </div>
              <div className="h-px w-10 bg-gold/40" />
            </div>
            <h1 className="font-serif font-light text-5xl text-parchment mb-3">
              Join the Future
            </h1>
            <p className="font-serif italic font-light text-parchment/50 text-lg">
              Create an account to start sealing memories.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 border border-terracotta/30 bg-terracotta/5 text-terracotta font-sans text-xs text-center tracking-wide"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 border border-green-400/30 bg-green-50/60 text-green-700 font-sans text-xs text-center tracking-wide"
            >
              {success}
            </motion.div>
          )}

          <div className="bg-black/20 border border-parchment/10 backdrop-blur-md p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
            <form onSubmit={handleRegister} className="space-y-7">
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-[0.25em] text-parchment/60 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  required
                  className="w-full bg-black/40 border border-parchment/20 focus:border-terracotta focus:bg-black/60 outline-none px-5 py-3.5 font-sans text-sm text-parchment placeholder:text-parchment/20 transition-all duration-300"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-[0.25em] text-parchment/60 mb-3">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-parchment/20 focus:border-terracotta focus:bg-black/60 outline-none px-5 py-3.5 pr-12 font-sans text-sm text-parchment placeholder:text-parchment/20 transition-all duration-300"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-parchment/30 hover:text-parchment/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-parchment/30 mt-2 font-sans">Minimum 6 characters</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-terracotta text-parchment py-4 font-sans text-xs font-bold uppercase tracking-[0.25em] hover:bg-gold hover:text-espresso transition-colors duration-500 disabled:opacity-40"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-8 text-center font-serif font-light text-parchment/50 text-base">
            Already have an account?{" "}
            <Link href="/login" className="text-terracotta hover:text-gold transition-colors underline underline-offset-4 decoration-terracotta/30">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
