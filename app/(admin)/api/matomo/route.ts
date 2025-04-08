import { NextResponse } from 'next/server'

const MATOMO_URL = 'https://analytics.kokomo.house/matomo/index.php'
const MATOMO_TOKEN = process.env.MATOMO_TOKEN
const SITE_ID = '2'

// Fallback für nicht definierte oder ungültige Werte
const normalizeValue = (value: number | null | undefined) => {
  return typeof value === 'number' && !isNaN(value) ? value : 0
}

// Dynamische Periodenlogik
const getDateRanges = (range: string) => {
  switch (range) {
    case 'last7':
      return {
        current: { period: 'range', date: 'last7' },
        previous: { period: 'range', date: 'previous7' },
      }
    case 'last28':
      return {
        current: { period: 'range', date: 'last28' },
        previous: { period: 'range', date: 'previous28' },
      }
    case 'day':
    default:
      return {
        current: { period: 'day', date: 'today' },
        previous: { period: 'day', date: 'yesterday' },
      }
  }
}

// Fetch-Funktion, die POST-body korrekt setzt
const fetchMatomoData = async (
  method: string,
  idSite: string,
  date: { period: string; date: string },
  token: string
) => {
  const body = new URLSearchParams({
    module: 'API',
    method,
    idSite,
    period: date.period,
    date: date.date,
    format: 'JSON',
    token_auth: token,
  })

  const res = await fetch(MATOMO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  return res.json()
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || 'day'
  const { current, previous } = getDateRanges(range)

  try {
    const [summaryNow, summaryPrev] = await Promise.all([
      fetchMatomoData('VisitsSummary.get', SITE_ID, current, MATOMO_TOKEN!),
      fetchMatomoData('VisitsSummary.get', SITE_ID, previous, MATOMO_TOKEN!),
    ])

    const [actionsNow, actionsPrev] = await Promise.all([
      fetchMatomoData('Actions.get', SITE_ID, current, MATOMO_TOKEN!),
      fetchMatomoData('Actions.get', SITE_ID, previous, MATOMO_TOKEN!),
    ])

    // Logging zur Kontrolle
    console.log('Matomo summaryNow:', summaryNow)
    console.log('Matomo summaryPrev:', summaryPrev)
    console.log('Matomo actionsNow:', actionsNow)
    console.log('Matomo actionsPrev:', actionsPrev)

    return NextResponse.json({
      visitors: {
        now: normalizeValue(summaryNow.nb_visits),
        prev: normalizeValue(summaryPrev.nb_visits),
      },
      pageviews: {
        now: normalizeValue(summaryNow.nb_actions),
        prev: normalizeValue(summaryPrev.nb_actions),
      },
      unique_pageviews: {
        now: normalizeValue(actionsNow.nb_uniq_pageviews),
        prev: normalizeValue(actionsPrev.nb_uniq_pageviews),
      },
      avg_time_on_site: {
        now: normalizeValue(summaryNow.avg_time_on_site),
        prev: normalizeValue(summaryPrev.avg_time_on_site),
      },
    })
  } catch (error) {
    console.error('Matomo API error:', error)
    return NextResponse.json({ error: 'Matomo API error' }, { status: 500 })
  }
}
