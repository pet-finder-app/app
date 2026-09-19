import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Esconde o indicador de dev do Next (o círculo "N" no canto da tela) —
  // só aparece em desenvolvimento, mas atrapalha ao conferir o layout.
  devIndicators: false,
};

export default nextConfig;
