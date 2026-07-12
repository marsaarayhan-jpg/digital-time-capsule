import { CapsuleStatus } from "./types";
import { supabase } from "./supabaseClient";

/**
 * Fix #8 — Single source of truth untuk logic lock/unlock status capsule.
 * Digunakan di dashboard, capsule detail, dan service layer.
 */
export function getCapsuleLockStatus(openDate: string): CapsuleStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const unlockDate = new Date(openDate);
  unlockDate.setHours(0, 0, 0, 0);
  return today < unlockDate ? "locked" : "unlocked";
}

/**
 * Menghapus file foto dari Supabase Storage ('capsule-photos' bucket) secara bersih.
 */
export async function deleteCapsulePhotoFromStorage(photoUrl?: string | null) {
  if (!photoUrl) return;
  try {
    const bucketName = "capsule-photos";
    const bucketIndex = photoUrl.indexOf(`${bucketName}/`);
    if (bucketIndex !== -1) {
      const objectPath = decodeURIComponent(photoUrl.substring(bucketIndex + bucketName.length + 1));
      if (objectPath) {
        console.log("Removing photo from storage:", objectPath);
        const { error } = await supabase.storage.from(bucketName).remove([objectPath]);
        if (error) {
          console.error("Error removing storage object:", error.message);
        }
      }
    }
  } catch (err) {
    console.error("Failed to delete photo from storage:", err);
  }
}

/**
 * Menghapus capsule secara menyeluruh baik dari Supabase Storage (foto) maupun PostgreSQL (baris capsule & komentar).
 */
export async function deleteCapsuleComplete(id: string, photoUrl?: string | null): Promise<{ error: Error | null }> {
  try {
    let urlToDelete = photoUrl;
    if (urlToDelete === undefined) {
      const { data } = await supabase.from("capsules").select("photo_url").eq("id", id).single();
      urlToDelete = data?.photo_url;
    }

    // Hapus foto dari storage (jika ada)
    if (urlToDelete) {
      await deleteCapsulePhotoFromStorage(urlToDelete);
    }

    // Hapus data dari tabel capsules (komentar otomatis terhapus via ON DELETE CASCADE)
    const { error } = await supabase.from("capsules").delete().eq("id", id);
    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error("Unknown error deleting capsule") };
  }
}
