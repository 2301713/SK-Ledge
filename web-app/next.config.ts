import type { NextConfig } from "next";

// Avatar and document previews are served from the Supabase Storage host of
// whichever project this build targets. Derive it from the public URL so a
// different Supabase project (staging/production) does not need a code change;
// fall back to the Supabase domain when the build has no URL configured.
const supabaseImageHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: supabaseImageHost ?? "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/core/client": false,
      "@x402/evm/exact/client": false,
      "@x402/evm/upto/client": false,
      "@x402/svm/exact/client": false,
      "@x402/evm": false,
    };

    config.externals = [
      "pino-pretty",
      "lokijs",
      "encoding",
      "@react-native-async-storage/async-storage",
      ...(Array.isArray(config.externals)
        ? config.externals
        : config.externals
          ? [config.externals]
          : []),
    ];

    return config;
  },
};

export default nextConfig;
