// app/api/analyze-matomo/route.ts
import { NextRequest, NextResponse } from 'next/server'

const MATOMO_API_URL = 'https://analytics.kokomo.house/matomo/index.php'
const SITE_ID = '2'
const TOKEN_AUTH = process.env.MATOMO_TOKEN || ''

async function fetchMatomoData(method: string, period: string = 'range', date: string) {
  const params = new URLSearchParams({
    module: 'API',
    method,
    idSite: SITE_ID,
    period,
    date,
    format: 'JSON',
    token_auth: TOKEN_AUTH,
  })

  console.log('🔍 Matomo API Call:', MATOMO_API_URL, params.toString())

  const res = await fetch(MATOMO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = await res.json()
  console.log(`✅ Matomo response for ${method}:`, data)
  return data
}

type PageData = {
  label: string
  nb_hits: number
  bounce_rate: number
  avg_time_on_page: number
}

export async function POST(req: NextRequest) {
  try {
    console.log('API Call: /api/analyze-matomo')

    const body = await req.json()
    const period = body.period || '30'

    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - parseInt(period) + 1)

    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    const range = `${formatDate(startDate)},${formatDate(today)}`

    const summary = await fetchMatomoData('VisitsSummary.get', 'range', range)
    const pages = await fetchMatomoData('Actions.getPageTitles', 'range', range)

    let topPages: { title: string; views: number; bounce: number; duration: number }[] = []

    if (pages?.result !== 'error' && Array.isArray(pages)) {
      topPages = pages
        .filter((p: PageData) => p.label)
        .map((p: PageData) => ({
          title: p.label,
          views: p.nb_hits,
          bounce: p.bounce_rate,
          duration: p.avg_time_on_page,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 20)
    } else {
      console.warn('⚠️ Fehler beim Laden der PageTitles:', pages.message)
    }

    const matomoData = {
      date: `Letzte ${period} Tage`,
      visitors: summary.nb_visits,
      pageviews: summary.nb_actions,
      avgTimeOnSite: summary.avg_time_on_site,
      bounceRate: summary.bounce_rate,
      topPages,
    }

    console.log('📊 Matomo Data for GPT:', matomoData)

    const prompt = `Hier sind Matomo-Daten:

${JSON.stringify(matomoData, null, 2)}

Was fällt auf? Gibt es Verbesserungsvorschläge? Bitte gib die Antwort im HTML-Format aus. Verwende Zwischenüberschriften und Absätze.`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Du bist ein erfahrener SEO- und Webanalyse-Experte. Analysiere die folgenden Matomo-Trackingdaten präzise und gib klare, umsetzbare Empfehlungen für die Verbesserung der SEO-Performance der Website.
                      1. Interpretiere die wichtigsten Kennzahlen (z. B. Seitenaufrufe, Absprungrate, durchschnittliche Besuchsdauer, beliebteste Seiten, Verweildauer).
                      2. Konvertiere Zeitangaben automatisch in Minuten und Sekunden (z. B. 145 Sekunden → 2 Minuten 25 Sekunden).
                      3. Gliedere deine Analyse in folgende Abschnitte:
                        - **Top Insights** (Bulletpoints der wichtigsten Erkenntnisse)
                        - **Konkrete SEO-Empfehlungen** (verbesserbare Punkte)
                      4. Antworte in reinem HTML, ohne Markdown, Codeblöcke oder Backticks
                      5. Gib am Ende einen SEO-Score von 1 bis 100 basierend auf deinen Erkenntnissen zurück.
                      6. Formatiere die gesamte Antwort als **valide HTML-Ausgabe** (mit <h2>, <ul>, <li>, <p>, <strong> etc.).

                      Verwende ausschliesslich Deutsch (Schweizer Hochdeutsch) und beachte die Formatierung für eine Schweizer Tastatur.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'GPT request failed' }, { status: 500 })
    }

    const data = await res.json()
    console.log('✅ GPT response:', data)

    let analysis = data.choices?.[0]?.message?.content || 'Keine Antwort erhalten.'
    if (analysis.startsWith('```html')) {
      analysis = analysis
        .replace(/^```html\s*/, '')
        .replace(/```$/, '')
        .trim()
    }

    return NextResponse.json({ analysis })
  } catch (e) {
    console.error('❌ Fehler bei der Analyse:', e)
    return NextResponse.json(
      { error: 'Analyse fehlgeschlagen', detail: String(e) },
      { status: 500 }
    )
  }
}
