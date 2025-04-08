'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

export default function MatomoScript() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) return null

  return (
    <Script id="matomo-analytics" strategy="afterInteractive">
      {`
        var _paq = window._paq = window._paq || [];
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
  )
}
