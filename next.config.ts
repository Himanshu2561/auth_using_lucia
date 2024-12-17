import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push("@node-rs/argon2", "@node-rs/bycrypt");
    return config;
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};

export default nextConfig;
