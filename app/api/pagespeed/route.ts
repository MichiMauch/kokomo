// app/api/pagespeed/route.ts
import { NextRequest, NextResponse } from 'next/server'

// ⏱️ Konfiguration für maximale Ausführungszeit
export const config = {
  maxDuration: 60, // bis zu 60 Sekunden erlaubt
}

const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY
const TARGET_URL = 'https://kokomo.house/'

export async function POST(req: NextRequest) {
  try {
    console.log('📈 PageSpeed API Call wird gestartet')

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      TARGET_URL
    )}&key=${PAGESPEED_API_KEY}&strategy=desktop&category=performance&category=accessibility&category=seo&category=best-practices`

    const response = await fetch(apiUrl)
    const json = await response.json()

    const lighthouse = json.lighthouseResult

    if (!lighthouse || !lighthouse.categories) {
      throw new Error('Ungültige Lighthouse-Daten')
    }

    const result = {
      performance: lighthouse.categories.performance?.score
        ? lighthouse.categories.performance.score * 100
        : null,
      accessibility: lighthouse.categories.accessibility?.score
        ? lighthouse.categories.accessibility.score * 100
        : null,
      bestPractices: lighthouse.categories['best-practices']?.score
        ? lighthouse.categories['best-practices'].score * 100
        : null,
      seo: lighthouse.categories.seo?.score ? lighthouse.categories.seo.score * 100 : null,
      pwa: lighthouse.categories.pwa?.score ? lighthouse.categories.pwa.score * 100 : null,
      url: lighthouse.finalUrl || TARGET_URL,
    }

    console.log('✅ PageSpeed Ergebnis:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Fehler beim PageSpeed-Test:', error)
    return NextResponse.json({ error: 'PageSpeed-Test fehlgeschlagen' }, { status: 500 })
  }
}
