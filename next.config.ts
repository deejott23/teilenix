import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — page cannot be embedded in iframes
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Control referrer information sent with requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features not needed by the app
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  // Force HTTPS for 1 year (Vercel handles HTTPS, this adds the header)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // Content Security Policy — allows Supabase, Google Fonts, and inline styles from Next.js
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + Workbox CDN for service worker
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://storage.googleapis.com",
      // Styles: self + Google Fonts + inline styles (used by Tailwind/Next.js)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + data URIs + Google avatars + Supabase Storage
      "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.supabase.co https://*.supabase.com",
      // Connect: Supabase + Google OAuth
      "connect-src 'self' https://*.supabase.co https://*.supabase.com wss://*.supabase.co https://accounts.google.com https://storage.googleapis.com",
      // Frames: none allowed
      "frame-src 'none'",
      // Workers: self (for service worker)
      "worker-src 'self' blob:",
      // Media: none
      "media-src 'none'",
      // Objects: none
      "object-src 'none'",
      // Base URI: restrict to self
      "base-uri 'self'",
      // Form action: restrict to self
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  compress: true,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
