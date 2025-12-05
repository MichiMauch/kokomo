import { NextResponse } from 'next/server'

const MATOMO_URL = 'https://analytics.kokomo.house/matomo/index.php'
const MATOMO_TOKEN = process.env.MATOMO_TOKEN
const SITE_ID = '2'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'monthly'

  let period = 'month'
  let date = 'last12'

  if (mode === 'daily') {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    period = 'day'
    date = `${yyyy}-${mm}-01,${yyyy}-${mm}-${dd}`
  }

  const body = new URLSearchParams({
    module: 'API',
    method: 'VisitsSummary.get',
    idSite: SITE_ID,
    period,
    date,
    format: 'JSON',
    token_auth: MATOMO_TOKEN!,
  })

  try {
    const res = await fetch(MATOMO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const raw = await res.json()

    type MatomoResponse = Record<string, { nb_visits: number }>
    const result = (Object.entries(raw) as [string, { nb_visits: number }][]).map(
      ([key, value]) => {
        const date = new Date(key)
        const label =
          mode === 'monthly'
            ? date.toLocaleString('de-CH', { month: 'short', year: 'numeric' })
            : date.toLocaleDateString('de-CH', { day: '2-digit' }) // 👉 nur Tag
        return {
          label,
          value: typeof value.nb_visits === 'number' ? value.nb_visits : 0,
        }
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Matomo API error:', error)
    return NextResponse.json({ error: 'Matomo API error' }, { status: 500 })
  }
}
