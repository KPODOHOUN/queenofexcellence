const isDev = process.env.NODE_ENV !== "production";

const kkiapayHosts = "https://*.kkiapay.me https://cdn.kkiapay.me https://api.kkiapay.me https://widget.kkiapay.me https://widget-v3.kkiapay.me";

const csp = [
  "default-src 'self'",
  "img-src 'self' https: data: blob:",
  "style-src 'self' 'unsafe-inline' https://*.kkiapay.me",
  `script-src 'self' 'unsafe-inline' ${kkiapayHosts}${isDev ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self' ${kkiapayHosts}${isDev ? " ws:" : ""}`,
  `frame-src 'self' ${kkiapayHosts}`,
  "font-src 'self' data: https://*.kkiapay.me",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  `form-action 'self' ${kkiapayHosts}`,
].join("; ");

/** @type {import("next").NextConfig} */
const nextConfig = {
  /** Accès au serveur de dev depuis un téléphone du réseau local. */
  allowedDevOrigins: ["10.50.12.133", "*.local"],
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    /** Cache disque de l'optimiseur Next (images externes uniquement). */
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
