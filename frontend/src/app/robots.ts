import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard/',
        '/capsule/', // Capsule details are private
      ],
    },
    sitemap: 'https://timecapsule.my.id/sitemap.xml',
  };
}
