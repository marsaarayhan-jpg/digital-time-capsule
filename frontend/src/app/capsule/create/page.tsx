"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { sendCapsuleNotification } from "@/lib/emailService";
import { toast } from "sonner";
import { encryptMessage } from "@/lib/encryptionUtils";
import { Eye, EyeOff, ImagePlus, X, UploadCloud } from "lucide-react";

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function CreateCapsule() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [showTitle, setShowTitle] = useState(false);

  // Photo states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const processFile = useCallback((file: File) => {
    setPhotoError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPhotoError("Unsupported format. Please use JPG, PNG, WEBP, or GIF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setPhotoError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, [photoPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadPhoto = async (userId: string): Promise<string | null> => {
    if (!photoFile) return null;
    const ext = photoFile.name.split(".").pop();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("capsule-photos")
      .upload(path, photoFile, { contentType: photoFile.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from("capsule-photos").getPublicUrl(path);
    return data.publicUrl;
  };

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

    // Upload foto terlebih dahulu (jika ada)
    let photoUrl: string | null = null;
    if (photoFile) {
      try {
        photoUrl = await uploadPhoto(user.id);
      } catch (err) {
        setError("Failed to upload photo. Please try again.");
        setLoading(false);
        return;
      }
    }

    // ENKRIPSI JUDUL DAN PESAN SEBELUM DISIMPAN
    const encryptedTitle = encryptMessage(formData.title);
    const encryptedMessage = encryptMessage(formData.message);

    const { error: insertError } = await supabase.from("capsules").insert([
      {
        title: encryptedTitle,
        message: encryptedMessage,
        receiver_email: formData.receiverEmail,
        open_date: formData.openDate,
        sender_id: user.id,
        photo_url: photoUrl,
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
                <div className="relative group/input">
                  <input
                    type={showTitle ? "text" : "password"}
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., To My Future Self"
                    className="w-full bg-black/20 border border-parchment/10 focus:border-terracotta focus:bg-black/40 outline-none px-5 py-4 font-serif text-xl text-parchment placeholder:text-parchment/20 transition-all duration-300 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTitle(!showTitle)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-parchment/40 hover:text-gold transition-colors"
                  >
                    {showTitle ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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

            {/* ── PHOTO UPLOAD ── */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-6 bg-gold/40" />
                <label className="font-sans text-[10px] uppercase tracking-[0.25em] text-parchment/60">
                  Attach a Photo{" "}
                  <span className="text-parchment/30 normal-case tracking-normal">(optional)</span>
                </label>
              </div>

              <AnimatePresence mode="wait">
                {photoPreview ? (
                  /* Preview State */
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative group overflow-hidden border border-gold/20 bg-black/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Selected memory photo"
                      className="w-full max-h-[360px] object-cover"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-4">
                      {/* Change */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-gold/90 hover:bg-gold text-espresso font-sans text-xs uppercase tracking-[0.2em] font-bold px-5 py-3"
                      >
                        <ImagePlus size={14} />
                        Change Photo
                      </button>
                      {/* Remove */}
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-terracotta/80 hover:bg-terracotta text-parchment font-sans text-xs uppercase tracking-[0.2em] font-bold px-5 py-3"
                      >
                        <X size={14} />
                        Remove
                      </button>
                    </div>
                    {/* File name badge */}
                    <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="font-sans text-[10px] text-parchment/60 truncate">{photoFile?.name}</p>
                    </div>
                  </motion.div>
                ) : (
                  /* Drop Zone State */
                  <motion.div
                    key="dropzone"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      relative cursor-pointer border transition-all duration-300 p-10
                      flex flex-col items-center justify-center gap-4
                      ${isDragging
                        ? "border-gold/60 bg-gold/5 scale-[1.01]"
                        : "border-dashed border-parchment/15 bg-black/10 hover:border-parchment/30 hover:bg-black/20"
                      }
                    `}
                  >
                    <motion.div
                      animate={isDragging ? { scale: 1.15, rotate: -5 } : { scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <UploadCloud
                        size={36}
                        className={`transition-colors duration-300 ${isDragging ? "text-gold" : "text-parchment/25"}`}
                      />
                    </motion.div>
                    <div className="text-center">
                      <p className="font-serif text-parchment/50 text-base mb-1">
                        {isDragging ? "Release to attach photo" : "Drag & drop a photo here"}
                      </p>
                      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-parchment/25">
                        or click to browse · JPG, PNG, WEBP, GIF · max {MAX_FILE_SIZE_MB}MB
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Photo validation error */}
              {photoError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 font-sans text-[11px] text-terracotta/80 tracking-wide"
                >
                  {photoError}
                </motion.p>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload capsule photo"
              />
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
