import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir acceso desde dispositivos en la red local durante desarrollo
  allowedDevOrigins: ["192.168.1.*", "26.208.229.*"],
};

export default nextConfig;
