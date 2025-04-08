import { NextResponse } from 'next/server'

const MATOMO_URL = 'https://analytics.kokomo.house/matomo/index.php'
const MATOMO_TOKEN = process.env.MATOMO_TOKEN
const SITE_ID = '2'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || 'day'

  const period = range === 'last7' || range === 'last28' ? 'range' : 'day'
  const date = range === 'last7' ? 'last7' : range === 'last28' ? 'last28' : 'today'

  const body = new URLSearchParams({
    module: 'API',
    method: 'Actions.getPageTitles', // ✅ Titel statt URL
    idSite: SITE_ID,
    period,
    date,
    format: 'JSON',
    token_auth: MATOMO_TOKEN!,
    filter_limit: '100',
    expanded: '1',
  })

  try {
    const res = await fetch(MATOMO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const json = await res.json()

    const topPages = Array.isArray(json)
      ? json
          // optional: nur Titel enthalten, die "tiny house" im Titel haben
          .filter((item: { label?: string; nb_hits: number }) =>
            item.label?.toLowerCase().includes('tiny house')
          )
          .map((item: { label?: string; nb_hits: number }) => ({
            label: item.label,
            hits: item.nb_hits,
          }))
          .sort((a, b) => b.hits - a.hits)
          .slice(0, 10)
      : []

    return NextResponse.json(topPages)
  } catch (error) {
    console.error('Matomo Top Page Titles API error:', error)
    return NextResponse.json({ error: 'Matomo API error' }, { status: 500 })
  }
}
