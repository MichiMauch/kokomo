'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Trend {
  id: number
  keyword: string
  value: number
  source: string
  category: string | null
  timestamp: string
}

export default function TrendsDashboard() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    source: '',
    category: '',
    limit: 30,
  })

  useEffect(() => {
    fetchTrends()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchTrends = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Parameter für die API-Anfrage erstellen
      const params = new URLSearchParams()
      if (filters.source) params.append('source', filters.source)
      if (filters.category) params.append('category', filters.category)
      params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/trends?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Fehler beim Abrufen der Trends: ${response.status}`)
      }

      const data = await response.json()
      setTrends(data.trends || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(errorMsg)
      console.error('Fehler beim Laden der Trends:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter aktualisieren
  const updateFilter = (name: keyof typeof filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  // Formatieren des Datums für bessere Lesbarkeit
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trend-Dashboard</h1>
        <Link href="/admin/trends" className="text-blue-600 hover:underline dark:text-blue-400">
          Zurück zur Übersicht
        </Link>
      </div>

      {/* Filter */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Filter</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="source-filter"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Quelle
            </label>
            <select
              id="source-filter"
              className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
              value={filters.source}
              onChange={(e) => updateFilter('source', e.target.value)}
            >
              <option value="">Alle Quellen</option>
              <option value="google-trends">Google Trends</option>
              <option value="google-trends-interest">Google Interesse</option>
              <option value="google-related-query">Verwandte Suchanfragen</option>
              <option value="google-rising-query">Steigende Suchanfragen</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="category-filter"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kategorie
            </label>
            <select
              id="category-filter"
              className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
              value={filters.category || ''}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              <option value="">Alle Kategorien</option>
              <option value="keyword-tracking">Keyword-Tracking</option>
              {trends.some((t) => t.category?.startsWith('related-to-')) && (
                <option value="related-to">Verwandte Anfragen</option>
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="limit-filter"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Anzahl
            </label>
            <select
              id="limit-filter"
              className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
              value={filters.limit}
              onChange={(e) => updateFilter('limit', parseInt(e.target.value))}
            >
              <option value="10">10 Einträge</option>
              <option value="30">30 Einträge</option>
              <option value="50">50 Einträge</option>
              <option value="100">100 Einträge</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trends Tabelle */}
      <div className="overflow-hidden rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Aktuelle Trends</h2>

        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Trends werden geladen...</p>
          </div>
        ) : error ? (
          <div className="rounded bg-red-100 p-4 dark:bg-red-900">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : trends.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Keine Trends gefunden. Sammle zuerst Daten über die Hauptseite.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                    Wert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                    Quelle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                    Zeitpunkt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {trends.map((trend) => (
                  <tr key={trend.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {trend.keyword}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {trend.source.includes('rising') && trend.value === 1000
                          ? 'Breakout'
                          : trend.value}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs leading-5 font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {trend.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {trend.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {formatDate(trend.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Aktualisieren Button */}
        <div className="mt-4 flex justify-end">
          <button
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={fetchTrends}
            disabled={isLoading}
          >
            {isLoading ? 'Wird geladen...' : 'Aktualisieren'}
          </button>
        </div>
      </div>
    </div>
  )
}
