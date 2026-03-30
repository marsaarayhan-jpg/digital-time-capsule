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
  metadataBase: new URL("https://timecapsule.my.id"),
  title: {
    default: "Digital Time Capsule — Seal Your Memories for the Future",
    template: "%s | Digital Time Capsule"
  },
  description: "Experience the most elegant digital time capsule. Seal your memories, messages, and future reflections until the perfect moment. Kapsul waktu digital terbaik di Indonesia untuk masa depan Anda.",
  keywords: [
    "digital time capsule", 
    "future messages", 
    "memory storage", 
    "sealed memories", 
    "kapsul waktu digital", 
    "kirim pesan ke masa depan",
    "send messages to the future",
    "digital safe for memories",
    "online time capsule",
    "digital vault",
    "kapsul waktu indonesia",
    "titip pesan masa depan",
    "simpan memori digital",
    "aplikasi kapsul waktu"
  ],
  authors: [{ name: "Digital Time Capsule Team" }],
  creator: "Digital Time Capsule",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://timecapsule.my.id",
    siteName: "Digital Time Capsule",
    title: "Digital Time Capsule — Seal Your Memories in Time",
    description: "The most elegant way to send messages to the future. Guard your memories with our digital vault.",
    images: [
      {
        url: "/og-image.jpg",
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
  verification: {
    google: "google4e3cc6d7cbb7bf70",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  themeColor: "#1f1612",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${cormorant.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Digital Time Capsule",
              "url": "https://timecapsule.my.id",
              "description": "Seal your memories for the future with our digital time capsule.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://timecapsule.my.id/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
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
