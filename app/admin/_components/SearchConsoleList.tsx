'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Row = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

type Range = '7d' | '28d' | '3m'

const PERIODS: { label: string; value: Range }[] = [
  { label: '7 Tage', value: '7d' },
  { label: '28 Tage', value: '28d' },
  { label: '3 Monate', value: '3m' },
]

export default function SearchConsoleList() {
  const [queryData, setQueryData] = useState<Row[]>([])
  const [chartData, setChartData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState<Range>('7d')

  useEffect(() => {
    loadData(range)
  }, [range])

  const loadData = async (range: Range) => {
    setLoading(true)

    const [queryRes, chartRes] = await Promise.all([
      fetch(`/api/searchconsole?range=${range}&type=query`),
      fetch(`/api/searchconsole?range=${range}&type=date`),
    ])

    const queryJson = await queryRes.json()
    const chartJson = await chartRes.json()

    setQueryData(queryJson.rows || [])
    setChartData(chartJson.rows || [])
    setLoading(false)
  }

  function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-')
    return `${day}.${month}.${year}`
  }

  const totalClicks = queryData.reduce((sum, row) => sum + row.clicks, 0)
  const totalImpressions = queryData.reduce((sum, row) => sum + row.impressions, 0)

  return (
    <div className="w-full p-6">
      <h3 className="mb-4 text-xl font-bold">🔍 Übersicht Suchbegriffe</h3>

      <div className="mb-4 space-y-2">
        <p className="font-medium text-gray-700">Zeitraum:</p>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setRange(p.value)}
              className={buttonStyle(range === p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div>Lade Daten...</div>
      ) : queryData.length === 0 ? (
        <p>Keine Daten gefunden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">Suchbegriff</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-600">Klicks</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-600">Impressionen</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-600">CTR</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-600">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queryData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{row.keys[0]}</td>
                  <td className="px-4 py-2 text-right">{row.clicks}</td>
                  <td className="px-4 py-2 text-right">{row.impressions}</td>
                  <td className="px-4 py-2 text-right">{(row.ctr * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right">{row.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700">Total</td>
                <td className="px-4 py-2 text-right font-semibold text-gray-800">
                  🖱️ {totalClicks}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-gray-800">
                  👀 {totalImpressions}
                </td>
                <td className="px-4 py-2 text-right text-gray-400" colSpan={2}>
                  –
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-lg font-semibold">📈 Verlauf der Klicks & Impressionen</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData.map((row) => ({
                date: formatDate(row.keys[0]),
                clicks: row.clicks,
                impressions: row.impressions,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="clicks" stroke="#1d4ed8" name="Klicks" />
              <Line type="monotone" dataKey="impressions" stroke="#10b981" name="Impressionen" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function buttonStyle(active: boolean) {
  return `rounded-md px-4 py-2 text-sm font-medium ${
    active ? 'bg-black text-white' : 'bg-secondary-500 hover:bg-secondary-300 text-white'
  }`
}
