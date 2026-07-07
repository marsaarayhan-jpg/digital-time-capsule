"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { getCapsuleLockStatus } from "@/lib/capsuleUtils";
import { toast } from "sonner";
import { Eye, EyeOff, ImagePlus, X, UploadCloud } from "lucide-react";
import { encryptMessage, decryptMessage } from "@/lib/encryptionUtils";

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function EditCapsule({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [showTitle, setShowTitle] = useState(false);

  // Photo states
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
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

      // DEKRIPSI JUDUL DAN PESAN UNTUK DITAMPILKAN DI FORM
      setFormData({
        title: decryptMessage(capsule.title),
        message: decryptMessage(capsule.message),
        receiverEmail: capsule.receiver_email,
        openDate: capsule.open_date,
      });

      if (capsule.photo_url) setExistingPhotoUrl(capsule.photo_url);
      setLoading(false);
    };

    checkUserAndFetchData();
  }, [id, router]);

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
    setRemoveExistingPhoto(false);
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

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
    setRemoveExistingPhoto(true);
    setExistingPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadNewPhoto = async (userId: string): Promise<string | null> => {
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

    // ENKRIPSI JUDUL DAN PESAN SEBELUM UPDATE
    const encryptedTitle = encryptMessage(formData.title);
    const encryptedMessage = encryptMessage(formData.message);

    // Tentukan nilai photo_url untuk update
    let updatedPhotoUrl: string | null | undefined = undefined;

    if (photoFile && user) {
      // Upload foto baru
      try {
        updatedPhotoUrl = await uploadNewPhoto(user.id);
      } catch {
        setError("Failed to upload photo. Please try again.");
        setSaving(false);
        return;
      }
    } else if (removeExistingPhoto) {
      // User memilih untuk hapus foto
      updatedPhotoUrl = null;
    }
    // Jika undefined → tidak ada perubahan foto

    const updatePayload: Record<string, unknown> = {
      title: encryptedTitle,
      message: encryptedMessage,
      receiver_email: formData.receiverEmail,
      open_date: formData.openDate,
    };

    if (updatedPhotoUrl !== undefined) {
      updatePayload.photo_url = updatedPhotoUrl;
    }

    const { error: updateError } = await supabase
      .from("capsules")
      .update(updatePayload)
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

  // Determine what to show in photo section
  const activePreview = photoPreview || existingPhotoUrl;
  const activeFile = photoFile;

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
                  <div className="relative group/input">
                    <input
                      type={showTitle ? "text" : "password"}
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-black/20 border border-parchment/10 focus:border-terracotta outline-none px-5 py-4 font-serif text-xl text-parchment pr-12"
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

              {/* ── PHOTO SECTION ── */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-6 bg-gold/40" />
                  <label className="font-sans text-[10px] uppercase tracking-[0.25em] text-parchment/60">
                    Photo Memory{" "}
                    <span className="text-parchment/30 normal-case tracking-normal">(optional)</span>
                  </label>
                </div>

                <AnimatePresence mode="wait">
                  {activePreview ? (
                    /* Preview State (new upload or existing photo) */
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
                        src={activePreview}
                        alt="Capsule photo memory"
                        className="w-full max-h-[360px] object-cover"
                      />

                      {/* Existing photo badge */}
                      {existingPhotoUrl && !photoFile && (
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 border border-gold/20">
                          <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-gold/70">Current Photo</p>
                        </div>
                      )}
                      {/* New file badge */}
                      {photoFile && (
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 border border-terracotta/30">
                          <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-terracotta/80">New Photo</p>
                        </div>
                      )}

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-gold/90 hover:bg-gold text-espresso font-sans text-xs uppercase tracking-[0.2em] font-bold px-5 py-3"
                        >
                          <ImagePlus size={14} />
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-terracotta/80 hover:bg-terracotta text-parchment font-sans text-xs uppercase tracking-[0.2em] font-bold px-5 py-3"
                        >
                          <X size={14} />
                          Remove
                        </button>
                      </div>

                      {/* File name badge (bottom) */}
                      <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="font-sans text-[10px] text-parchment/60 truncate">
                          {activeFile ? activeFile.name : "Previously attached photo"}
                        </p>
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
