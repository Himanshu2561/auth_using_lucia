import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push("@node-rs/argon2", "@node-rs/bycrypt");
    return config;
  },
};

export default nextConfig;
