import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const MATOMO_API_URL = 'https://openmetrics.netnode.ch/index.php'
const SITE_ID = '6'
const TOKEN_AUTH = process.env.MATOMO_TOKEN_NETNODE || ''

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

  const res = await fetch(MATOMO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  return await res.json()
}

function formatDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function trimTop<T>(data: T[], max = 3): T[] {
  return Array.isArray(data) ? data.slice(0, max) : []
}

function calcChangePercent(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return Math.round(((current - previous) / previous) * 100)
}

type PageData = {
  label: string
  nb_hits: number
  bounce_rate: number
  avg_time_on_page: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const period = body.period || '30'
    const days = parseInt(period)

    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - days + 1)
    const rangeCurrent = `${formatDate(startDate)},${formatDate(today)}`

    const endDatePrev = new Date(startDate)
    endDatePrev.setDate(endDatePrev.getDate() - 1)
    const startDatePrev = new Date(endDatePrev)
    startDatePrev.setDate(startDatePrev.getDate() - days + 1)
    const rangePrev = `${formatDate(startDatePrev)},${formatDate(endDatePrev)}`

    const [
      summaryCurrent,
      pagesCurrent,
      referrersCurrent,
      devicesCurrent,
      exitsCurrent,
      summaryPrev,
      pagesPrev,
      referrersPrev,
      devicesPrev,
      exitsPrev,
    ] = await Promise.all([
      fetchMatomoData('VisitsSummary.get', 'range', rangeCurrent),
      fetchMatomoData('Actions.getPageTitles', 'range', rangeCurrent),
      fetchMatomoData('Referrers.getAll', 'range', rangeCurrent),
      fetchMatomoData('DevicesDetection.getType', 'range', rangeCurrent),
      fetchMatomoData('Actions.getExitPageTitles', 'range', rangeCurrent),

      fetchMatomoData('VisitsSummary.get', 'range', rangePrev),
      fetchMatomoData('Actions.getPageTitles', 'range', rangePrev),
      fetchMatomoData('Referrers.getAll', 'range', rangePrev),
      fetchMatomoData('DevicesDetection.getType', 'range', rangePrev),
      fetchMatomoData('Actions.getExitPageTitles', 'range', rangePrev),
    ])

    const enrichedPages = pagesCurrent
      .filter((p: PageData) => p.label)
      .map((p: PageData) => {
        const previous = pagesPrev.find((pp: PageData) => pp.label === p.label)
        const viewsCurr = p.nb_hits
        const viewsPrev = previous?.nb_hits || 0
        const bounceCurr = p.bounce_rate
        const bouncePrev = previous?.bounce_rate || 0
        const durationCurr = p.avg_time_on_page
        const durationPrev = previous?.avg_time_on_page || 0

        return {
          title: p.label,
          views: {
            current: viewsCurr,
            previous: viewsPrev,
            changePercent: calcChangePercent(viewsCurr, viewsPrev),
          },
          bounce: {
            current: bounceCurr,
            previous: bouncePrev,
            changePercent: calcChangePercent(bounceCurr, bouncePrev),
          },
          duration: {
            current: durationCurr,
            previous: durationPrev,
            changePercent: calcChangePercent(durationCurr, durationPrev),
          },
        }
      })

    const topPages = enrichedPages.sort((a, b) => b.views.current - a.views.current).slice(0, 10)

    const topGrowthPages = enrichedPages
      .filter((p) => p.views.previous > 0 || p.views.current > 0)
      .sort((a, b) => b.views.changePercent - a.views.changePercent)
      .slice(0, 3)

    const matomoData = {
      zeitraum: `Letzte ${period} Tage`,
      vergleichszeitraum: `Vorherige ${period} Tage`,
      visitors: {
        current: summaryCurrent.nb_visits,
        previous: summaryPrev.nb_visits,
        changePercent: calcChangePercent(summaryCurrent.nb_visits, summaryPrev.nb_visits),
      },
      pageviews: {
        current: summaryCurrent.nb_actions,
        previous: summaryPrev.nb_actions,
        changePercent: calcChangePercent(summaryCurrent.nb_actions, summaryPrev.nb_actions),
      },
      avgTimeOnSite: {
        current: summaryCurrent.avg_time_on_site,
        previous: summaryPrev.avg_time_on_site,
        changePercent: calcChangePercent(
          summaryCurrent.avg_time_on_site,
          summaryPrev.avg_time_on_site
        ),
      },
      bounceRate: {
        current: summaryCurrent.bounce_rate,
        previous: summaryPrev.bounce_rate,
        changePercent: calcChangePercent(summaryCurrent.bounce_rate, summaryPrev.bounce_rate),
      },
      topPages,
      topGrowthPages,
      referrers: {
        current: trimTop(referrersCurrent),
        previous: trimTop(referrersPrev),
      },
      devices: {
        current: trimTop(devicesCurrent),
        previous: trimTop(devicesPrev),
      },
      exitPages: {
        current: trimTop(exitsCurrent),
        previous: trimTop(exitsPrev),
      },
    }

    const prompt = `Hier sind Matomo-Daten für zwei Zeiträume:

${JSON.stringify(matomoData)}

Bitte analysiere die Unterschiede. Berücksichtige:
- Entwicklung der Gesamtkennzahlen
- Top-Seiten nach Besucherzahl
- Seiten mit dem grössten Wachstum
- Absprungrate und Verweildauer
- Referrer-Quellen, Geräteverteilung, Exit-Pages

Formuliere eine strukturierte HTML-Antwort in Schweizer Hochdeutsch.
Nutze Abschnitte, Absätze, Listen und am Ende eine Empfehlung.`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: `Du bist ein erfahrener SEO- und Webanalyse-Experte. 
                      Vergleiche Matomo-Daten aus zwei Zeiträumen, gib klare Empfehlungen. 
                      Antworte in HTML mit <h2>, <p>, <ul>, <li>, <strong>. 
                      Konvertiere Zeiten in Minuten/Sekunden.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('🧨 GPT API Fehlerdetails:', errorText)
      return NextResponse.json({ error: 'GPT request failed', detail: errorText }, { status: 500 })
    }

    const data = await res.json()
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
