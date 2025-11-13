import { withContentlayer } from 'next-contentlayer2';
import withBundleAnalyzer from '@next/bundle-analyzer';
import withMDX from '@next/mdx';
import remarkImagePath from './lib/remark-image-path.mjs';
import remarkGroupImages from './lib/remark-group-images.mjs';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withMDXConfig = withMDX({
  extension: /\.mdx?$/,
  remarkPlugins: [remarkImagePath, remarkGroupImages],
});

// You might need to insert additional domains in script-src if you are using external services
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' giscus.app analytics.umami.is analytics.kokomo.house va.vercel-scripts.com rag.mauch.rocks;
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src *.s3.amazonaws.com;
  connect-src *;
  font-src 'self' data:;
  frame-src giscus.app https://www.youtube.com analytics.kokomo.house www.google.com rag.mauch.rocks
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];


const output = process.env.EXPORT ? 'export' : undefined;
const basePath = process.env.BASE_PATH || undefined;
const unoptimized = process.env.UNOPTIMIZED ? true : undefined;

/**
 * @type {import('next/dist/next-server/server/config').NextConfig}
 */
const nextConfig = () => {
  // Die Reihenfolge der Plugins kann wichtig sein – hier werden
  // withContentlayer, withMDXConfig und bundleAnalyzer nacheinander angewendet.
  const plugins = [withContentlayer, withMDXConfig, bundleAnalyzer];
  return plugins.reduce((acc, next) => next(acc), {
    output,
    basePath,
    reactStrictMode: true,
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    eslint: {
      dirs: ['app', 'components', 'layouts', 'scripts'],
    },
    env: {
      GITHUB_ACCESS_TOKEN: process.env.GITHUB_ACCESS_TOKEN,
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'picsum.photos',
        },
        {
          protocol: 'https',
          hostname: 'pub-29ede69a4da644b9b81fa3dd5f8e9d6a.r2.dev',
        },
        {
          protocol: 'https',
          hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        },
        {
          protocol: 'https',
          hostname: '*.blob.core.windows.net',
        },
      ],
      unoptimized,
    },
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: securityHeaders,
        },
      ];
    },
    webpack: (config, options) => {
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      });
      return config;
    },
  });
};

export default nextConfig();
