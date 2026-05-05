import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent MIME-type sniffing — stops browsers from executing a file as a
  // different type than declared (e.g. a PDF treated as JS)
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Block clickjacking — disallow this site being embedded in iframes on
  // other domains. /embed/* is excluded below because it is intentionally iframed.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // Limit referrer info sent cross-origin — prevents dashboard URLs (which
  // contain chatbot IDs) from leaking to third-party sites via the Referer header
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Disable browser APIs the app never uses — limits damage if a script is injected
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },

  // Force HTTPS for 2 years — prevents SSL-stripping attacks in production
  // (browsers ignore this header on plain HTTP, so it's safe to set unconditionally)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise that this is a Next.js app
  async headers() {
    return [
      {
        // Apply security headers to all routes ...
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // ... except the embed route, which must be iframeable from any origin
        source: "/embed/(.*)",
        headers: securityHeaders.filter(h => h.key !== "X-Frame-Options"),
      },
    ];
  },
};

export default nextConfig;
