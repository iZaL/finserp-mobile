import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Get API URL from environment and extract hostname
const getImageRemotePatterns = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  try {
    const url = new URL(apiUrl);
    const pattern: {
      protocol: 'http' | 'https';
      hostname: string;
      pathname: string;
      port?: string;
    } = {
      protocol: url.protocol.replace(':', '') as 'http' | 'https',
      hostname: url.hostname,
      pathname: '/storage/**',
    };

    // Only add port if it's not default (80 for http, 443 for https)
    if (url.port && url.port !== '80' && url.port !== '443') {
      pattern.port = url.port;
    }

    return [pattern];
  } catch {
    // Fallback to localhost if URL parsing fails
    return [
      {
        protocol: 'http' as const,
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http' as const,
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
    ];
  }
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getImageRemotePatterns(),
  },
};

export default withNextIntl(nextConfig);
