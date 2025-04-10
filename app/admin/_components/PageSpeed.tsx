'use client'

import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import { BoltIcon, EyeIcon, StarIcon } from '@heroicons/react/24/outline'

export default function PageSpeedDashboardCard() {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('https://kokomo.house')
  const [result, setResult] = useState<null | {
    performance: number
    accessibility: number
    seo: number
    bestPractices: number
    url: string
  }>(null)
  const [error, setError] = useState('')

  const handleRunTest = async () => {
    setLoading(true)
    setResult(null)
    setError('')

    try {
      const res = await fetch('/api/pagespeed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!res.ok) {
        throw new Error('Fehler beim Abrufen der PageSpeed-Daten')
      }

      const data = await res.json()
      setResult(data)
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('Unbekannter Fehler')
      }
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Performance',
      value: result?.performance,
      icon: BoltIcon,
    },
    {
      title: 'Accessibility',
      value: result?.accessibility,
      icon: EyeIcon,
    },
    {
      title: 'SEO',
      value: result?.seo,
      icon: StarIcon,
    },
    {
      title: 'Best Practices',
      value: result?.bestPractices,
      icon: StarIcon,
    },
  ]

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🔍 PageSpeed Test</h3>
          <p className="text-sm text-gray-600">Starte einen aktuellen Google PageSpeed Test.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="focus:border-secondary-500 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring focus:ring-blue-200"
            placeholder="https://deine-seite.ch"
          />
          <button
            onClick={handleRunTest}
            className="bg-secondary-500 hover:bg-secondary-300 rounded-md px-4 py-2 text-sm text-white"
            disabled={loading}
          >
            {loading ? 'Test wird ausgeführt…' : 'Test starten'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-6">
          <LoadingSpinner />
          <p className="mt-2 text-sm text-gray-500">PageSpeed-Test läuft gerade…</p>
        </div>
      )}

      {error && !loading && <p className="text-sm text-red-500">{error}</p>}

      {result && !loading && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-500">URL: {result.url}</p>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((item, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
              >
                <dt>
                  <div className="bg-primary-500 absolute rounded-md p-3">
                    <item.icon className="size-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.title}</p>
                </dt>
                <dd className="ml-16 flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                </dd>
              </div>
            ))}
          </dl>
          <div className="pt-4 text-sm">
            <a
              href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(result.url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary-500 hover:underline"
            >
              🔗 Direkt zur detaillierten PageSpeed-Auswertung
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
