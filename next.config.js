/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Fornece polyfills para o módulo buffer
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/')
    };

    return config;
  },
  // Desativa a verificação do ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configurações de imagens
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "replicate.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "www.gstatic.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Outras configurações do Next.js
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig; 