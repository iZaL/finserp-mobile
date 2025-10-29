import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'tijara.test',
        port: '',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: '172.20.10.4',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'finserp-mobile.on-forge.com',
        port: '',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'manar.on-forge.com',
        port: '',
        pathname: '/storage/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
