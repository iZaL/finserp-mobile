import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Get API URL from environment and extract hostname, plus all known hosts
const getImageRemotePatterns = () => {
  const patterns: Array<{
    protocol: 'http' | 'https';
    hostname: string;
    pathname: string;
    port?: string;
  }> = [
    // Known production/staging hosts
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
    {
      protocol: 'https',
      hostname: 'manar.finserp.com',
      port: '',
      pathname: '/storage/**',
    },
    // Development hosts
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
      protocol: 'http',
      hostname: '127.0.0.1',
      port: '8000',
      pathname: '/storage/**',
    },
  ];

  // Add dynamic pattern from environment if available
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      const dynamicPattern: {
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
        dynamicPattern.port = url.port;
      } else {
        dynamicPattern.port = '';
      }

      // Check if this pattern is not already in the list
      const exists = patterns.some(
        p => p.hostname === dynamicPattern.hostname &&
             p.port === dynamicPattern.port &&
             p.protocol === dynamicPattern.protocol
      );

      if (!exists) {
        patterns.push(dynamicPattern);
      }
    } catch {
      // If URL parsing fails, just use the predefined patterns
    }
  }

  return patterns;
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getImageRemotePatterns(),
  },
  // Add headers for service worker cache control
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
