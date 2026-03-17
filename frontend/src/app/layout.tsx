import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import AudioPlayer from "@/components/AudioPlayer";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Digital Time Capsule — Seal Your Memories",
    template: "%s | Digital Time Capsule"
  },
  description: "Seal your memories, messages, and reflections inside a digital capsule. Choose a date in the future, and we'll ensure they remain safely locked until the perfect moment.",
  keywords: ["digital time capsule", "future messages", "memory storage", "sealed memories", "kapsul waktu digital"],
  authors: [{ name: "Digital Time Capsule Team" }],
  creator: "Digital Time Capsule",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kapsulwaktu.com", // Ganti dengan domain asli Anda nanti
    siteName: "Digital Time Capsule",
    title: "Digital Time Capsule — Seal Your Memories in Time",
    description: "The most elegant way to send messages to the future. Guard your memories with our digital vault.",
    images: [
      {
        url: "/og-image.jpg", // Pastikan file ini ada di folder public
        width: 1200,
        height: 630,
        alt: "Digital Time Capsule Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Time Capsule — Seal Your Memories",
    description: "Guard your memories and send them to your future self or loved ones.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${cormorant.variable} antialiased`}>
        <Toaster 
          position="top-right" 
          theme="dark" 
          toastOptions={{
            style: {
              background: '#1a1412',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              color: '#e2d1c3',
              fontFamily: 'var(--font-cormorant)',
              fontSize: '16px',
              borderRadius: '0',
            },
            className: 'sonner-toast',
          }}
        />
        <AudioPlayer />
        {children}
      </body>
    </html>
  );
}
