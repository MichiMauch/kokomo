import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/google-auth'

function getDateRange(range: string): { startDate: string; endDate: string } {
  const today = new Date()
  const endDate = today.toISOString().split('T')[0]

  const startDateObj = new Date()
  if (range === '7d') startDateObj.setDate(today.getDate() - 7)
  else if (range === '28d') startDateObj.setDate(today.getDate() - 28)
  else if (range === '3m') startDateObj.setMonth(today.getMonth() - 3)
  else startDateObj.setDate(today.getDate() - 7)

  const startDate = startDateObj.toISOString().split('T')[0]
  return { startDate, endDate }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getAccessToken()
    const range = req.nextUrl.searchParams.get('range') || '7d'
    const type = req.nextUrl.searchParams.get('type') || 'query'

    const { startDate, endDate } = getDateRange(range)

    const res = await fetch(
      'https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.kokomo.house%2F/searchAnalytics/query',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: [type],
          rowLimit: type === 'date' ? 1000 : 25,
        }),
      }
    )

    const json = await res.json()
    return NextResponse.json(json)
  } catch (err) {
    return NextResponse.json({ error: 'API-Fehler', details: err }, { status: 500 })
  }
}
