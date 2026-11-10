import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // Hide Next's development indicator because
  // it obscures layout previews.
  devIndicators: false,
};

export default nextConfig;
