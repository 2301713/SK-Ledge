import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
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
