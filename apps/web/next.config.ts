import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // ponytail: pnpm symlink next ke luar apps/web, root harus monorepo agar Turbopack bisa resolve
    root: path.resolve(import.meta.dirname, "..", ".."),
  },
};

export default nextConfig;
