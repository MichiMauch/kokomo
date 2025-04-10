// app/api/analyze-matomo/route.ts
import { NextRequest, NextResponse } from 'next/server'

// ⏱️ Konfiguration für maximale Ausführungszeit
export const maxDuration = 60 // ⏱️ bis zu 60 Sekunden erlaubt

const MATOMO_API_URL = 'https://analytics.kokomo.house/matomo/index.php'
const SITE_ID = '2'
const TOKEN_AUTH = process.env.MATOMO_TOKEN || ''

async function fetchMatomoData(method: string, period: string = 'month', date: string = 'last12') {
  const formData = new URLSearchParams({
    module: 'API',
    method,
    idSite: SITE_ID,
    period,
    date,
    format: 'JSON',
    token_auth: TOKEN_AUTH,
  })

  console.log('🔍 Matomo API Call:', method)

  const res = await fetch(MATOMO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const json = await res.json()
  console.log(`✅ Matomo response for ${method}:`, json)
  return json
}

export async function POST(req: NextRequest) {
  try {
    console.log('📩 API Call: /admin/api/analyze-matomo')

    const summary = await fetchMatomoData('VisitsSummary.get')
    const pages = await fetchMatomoData('Actions.getPageTitles')

    const topPages = Object.entries(pages)
      .map(([title, data]) => {
        const pageData = data as { nb_hits: number; bounce_rate: number; avg_time_on_page: number }
        return {
          title,
          views: pageData.nb_hits,
          bounce: pageData.bounce_rate,
          duration: pageData.avg_time_on_page,
        }
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    const matomoData = {
      date: 'Letzte 12 Monate',
      visitors: summary.nb_visits,
      pageviews: summary.nb_actions,
      avgTimeOnSite: summary.avg_time_on_site,
      bounceRate: summary.bounce_rate,
      topPages,
    }

    console.log('📊 Matomo Data for GPT:', matomoData)

    const prompt = `Hier sind Matomo-Daten:

${JSON.stringify(matomoData, null, 2)}

Was fällt auf? Gibt es Verbesserungsvorschläge?`

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
            content:
              'Du bist ein Webanalyse-Experte. Interpretiere Matomo-Daten und gib klare Empfehlungen.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    console.log('🤖 GPT request sent')

    if (!res.ok) {
      console.error('❌ GPT request failed with status', res.status)
      return NextResponse.json({ error: 'GPT request failed' }, { status: 500 })
    }

    const data = await res.json()
    console.log('✅ GPT response:', data)

    const analysis = data.choices?.[0]?.message?.content || 'Keine Antwort erhalten.'

    return NextResponse.json({ analysis })
  } catch (e) {
    console.error('❌ Fehler in /analyze-matomo:', e)
    return NextResponse.json(
      { error: 'Analyse fehlgeschlagen', detail: String(e) },
      { status: 500 }
    )
  }
}
