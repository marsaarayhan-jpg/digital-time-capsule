import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/capsule/create', // Halaman pembuatan kapsul publik agar bisa di-indeks
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/capsule/', // Melindungi detail kapsul dari index search engine
        ],
      },
    ],
    sitemap: 'https://timecapsule.my.id/sitemap.xml',
  };
}
