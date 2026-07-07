import CryptoJS from 'crypto-js';

// Secret key — Sebaiknya didefinisikan di .env.local
// Jika tidak ada, gunakan fallback (tapi ini kurang aman untuk produksi)
const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'kapsul-waktu-digital-secret-123';

/**
 * Mengenkripsi pesan teks ke format AES
 */
export const encryptMessage = (message: string): string => {
  try {
    return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
  } catch (err) {
    console.error("Encryption error:", err);
    return message; // Fallback jika gagal (tidak ideal)
  }
};

/**
 * Mendekripsi pesan dari format AES kembali ke teks asli
 */
export const decryptMessage = (encryptedMessage: string): string => {
  try {
    // Jika pesan tidak terenkripsi (plain text dari data lama), return apa adanya
    if (!encryptedMessage.includes('U2FsdGVkX1')) {
       return encryptedMessage; 
    }
    
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    
    // Jika hasil dekripsi kosong, mungkin kunci salah atau data bukan terenkripsi
    return originalText || encryptedMessage;
  } catch (err) {
    console.error("Decryption error:", err);
    return encryptedMessage;
  }
};
