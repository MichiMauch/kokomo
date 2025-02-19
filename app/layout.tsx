import type React from 'react'
import Script from 'next/script'
import 'css/tailwind.css'
import 'pliny/search/algolia.css'
import 'remark-github-blockquote-alert/alert.css'
import { Analytics } from '@vercel/analytics/react'

import { Poppins as PoppinsFont } from 'next/font/google'
import { SearchProvider, type SearchConfig } from 'pliny/search'
import Header from '@/components/Header'
import SectionContainer from '@/components/SectionContainer'
import Footer from '@/components/Footer'
import siteMetadata from '@/data/siteMetadata'
import { ThemeProviders } from './theme-providers'
import type { Metadata } from 'next'
import { genPageMetadata } from './seo' // Importieren Sie die Funktion

const Poppins = PoppinsFont({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-Poppins',
})

export const metadata = genPageMetadata({
  title: 'KOKOMO House',
  description:
    'Seit September 2022 wohnen wir in unserem Tiny House KOKOMO und berichten hier über unsere Erfahrungen.',
  icons: {
    // Standard Favicons
    icon: [
      { url: '/static/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/static/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/static/favicons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    // Apple Touch Icons
    apple: [
      { url: '/static/favicons/apple-touch-icon-57x57.png', sizes: '57x57', type: 'image/png' },
      { url: '/static/favicons/apple-touch-icon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/static/favicons/apple-touch-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/static/favicons/apple-touch-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/static/favicons/apple-touch-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/static/favicons/apple-touch-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/static/favicons/apple-touch-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/static/favicons/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/static/favicons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/static/favicons/apple-touch-icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    // Microsoft Tile Icons
    other: [
      {
        rel: 'icon',
        url: '/static/favicons/favicon.ico',
        type: 'image/x-icon',
      },
      {
        rel: 'msapplication-TileImage',
        url: '/static/favicons/mstile-70x70.png',
      },
      {
        rel: 'msapplication-TileImage',
        url: '/static/favicons/mstile-150x150.png',
      },
      {
        rel: 'msapplication-TileImage',
        url: '/static/favicons/mstile-310x310.png',
      },
    ],
  },
  // Zusätzliche Manifest-Dateien
  manifest: '/static/favicons/site.webmanifest',
  other: {
    'msapplication-config': '/static/favicons/browserconfig.xml',
  },
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const basePath = process.env.BASE_PATH || ''

  return (
    <html
      lang={siteMetadata.language}
      className={`${Poppins.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <Script id="matomo-analytics" strategy="afterInteractive">
          {`
            var _paq = window._paq = window._paq || [];
            /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u="//analytics.kokomo.house/matomo/";
              _paq.push(['setTrackerUrl', u+'matomo.php']);
              _paq.push(['setSiteId', '2']);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
            })();
          `}
        </Script>
      </head>
      <body className="relative bg-white pl-[calc(100vw-100%)] text-black antialiased dark:bg-gray-950 dark:text-white">
        <svg
          className="absolute inset-0 -z-10 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <ThemeProviders>
          <div className="flex min-h-screen flex-col">
            <SectionContainer>
              <SearchProvider searchConfig={siteMetadata.search as SearchConfig}>
                <Header />
                <main className="mb-auto">{children}</main>
              </SearchProvider>
            </SectionContainer>
            {/* Footer außerhalb des SectionContainer für volle Breite */}
            <Footer />
          </div>
        </ThemeProviders>
      </body>
    </html>
  )
}
