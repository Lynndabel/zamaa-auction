/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    // Ignore optional pretty logger dependency pulled by WalletConnect/pino in the browser
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'pino-pretty': false,
    };
    return config;
  },
}

module.exports = nextConfig
