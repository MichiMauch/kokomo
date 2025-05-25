'use client'

import { useState } from 'react'
import Link from 'next/link'

// Definiere Interfaces für die Typen
interface TrendQuery {
  keyword: string
  value: number | string
}

interface TrendResult {
  success: boolean
  message: string
  data?: {
    topQueries?: TrendQuery[]
    risingQueries?: TrendQuery[]
  }
}

export default function CollectDataPage() {
  const [isCollecting, setIsCollecting] = useState(false)
  const [result, setResult] = useState<TrendResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [selectedQueries, setSelectedQueries] = useState<string[]>([])

  // Trend-Daten sammeln
  const collectTrends = async () => {
    setIsCollecting(true)
    setResult(null)
    setError(null)

    try {
      // Rufe die neue Google Trends API-Route auf
      const response = await fetch('/api/trends/collect-google', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err: unknown) {
      console.error('Fehler bei Trend-Datensammlung:', err)
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsCollecting(false)
    }
  }

  // Verwandte Suchanfragen sammeln
  const collectRelatedQueries = async () => {
    if (!keyword.trim()) {
      setError('Bitte gib ein Keyword ein')
      return
    }

    setIsCollecting(true)
    setResult(null)
    setError(null)

    try {
      // Hier würden wir später eine API-Route aufrufen, die die verwandten Abfragen sammelt
      // Für den Prototyp simulieren wir eine Antwort

      // Simuliere Ladezeit
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simuliere Ergebnis
      setResult({
        success: true,
        message: `Verwandte Abfragen für "${keyword}" erfolgreich gesammelt`,
        data: {
          topQueries: [
            { keyword: `${keyword} kaufen`, value: 100 },
            { keyword: `${keyword} mieten`, value: 85 },
            { keyword: `${keyword} bauen`, value: 70 },
            { keyword: `${keyword} kosten`, value: 65 },
          ],
          risingQueries: [
            { keyword: `${keyword} finanzierung`, value: 'Breakout' },
            { keyword: `${keyword} bauplan`, value: 400 },
            { keyword: `${keyword} genehmigung`, value: 300 },
          ],
        },
      })

      // Simuliere Auswahl
      setSelectedQueries([`${keyword} kaufen`, `${keyword} finanzierung`, `${keyword} bauplan`])
    } catch (err: unknown) {
      console.error('Fehler bei Sammlung verwandter Abfragen:', err)
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsCollecting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trend-Daten sammeln</h1>
        <Link href="/admin/trends" className="text-blue-600 hover:underline dark:text-blue-400">
          Zurück zur Übersicht
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Allgemeine Trends */}
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Allgemeine Trend-Daten</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Startet einen Durchlauf zur Sammlung allgemeiner Trend-Daten von Google Trends und
            anderen Quellen mit Fokus auf Tiny Houses und verwandten Themen.
          </p>

          <button
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={collectTrends}
            disabled={isCollecting}
          >
            {isCollecting ? 'Daten werden gesammelt...' : 'Trend-Daten sammeln'}
          </button>
        </div>

        {/* Verwandte Abfragen */}
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Verwandte Suchanfragen</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Analysiert verwandte Suchanfragen für ein spezifisches Keyword, um Inhaltsideen zu
            generieren und zusätzliche Trends zu identifizieren.
          </p>

          <div className="mb-4">
            <label
              htmlFor="keyword-input"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Keyword
            </label>
            <input
              id="keyword-input"
              type="text"
              className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
              placeholder="z.B. tiny house oder nachhaltigkeit"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={isCollecting}
            />
          </div>

          <button
            className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            onClick={collectRelatedQueries}
            disabled={isCollecting || !keyword.trim()}
          >
            {isCollecting ? 'Abfragen werden analysiert...' : 'Verwandte Abfragen analysieren'}
          </button>
        </div>
      </div>

      {/* Ergebnisse */}
      {(result || error) && (
        <div className="mt-6 rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Ergebnis</h2>

          {error ? (
            <div className="rounded bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-200">
              <p>
                <strong>Fehler:</strong> {error}
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="rounded bg-green-100 p-3 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                <p>
                  <strong>Erfolg:</strong> {result.message || 'Daten erfolgreich gesammelt'}
                </p>
              </div>

              {result.data?.topQueries && (
                <div>
                  <h3 className="mb-2 text-lg font-medium">Top Suchanfragen</h3>
                  <div className="space-y-2">
                    {result.data.topQueries.map((query, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`top-${index}`}
                          className="mr-2"
                          checked={selectedQueries.includes(query.keyword)}
                          onChange={() => {
                            if (selectedQueries.includes(query.keyword)) {
                              setSelectedQueries((prev) => prev.filter((q) => q !== query.keyword))
                            } else {
                              setSelectedQueries((prev) => [...prev, query.keyword])
                            }
                          }}
                        />
                        <label htmlFor={`top-${index}`} className="flex-1">
                          <span className="font-medium">{query.keyword}</span>
                          <span className="ml-2 text-sm text-gray-500">({query.value})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.data?.risingQueries && (
                <div>
                  <h3 className="mb-2 text-lg font-medium">Steigende Suchanfragen</h3>
                  <div className="space-y-2">
                    {result.data.risingQueries.map((query, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`rising-${index}`}
                          className="mr-2"
                          checked={selectedQueries.includes(query.keyword)}
                          onChange={() => {
                            if (selectedQueries.includes(query.keyword)) {
                              setSelectedQueries((prev) => prev.filter((q) => q !== query.keyword))
                            } else {
                              setSelectedQueries((prev) => [...prev, query.keyword])
                            }
                          }}
                        />
                        <label htmlFor={`rising-${index}`} className="flex-1">
                          <span className="font-medium">{query.keyword}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            ({query.value === 'Breakout' ? '🚀 Breakout' : query.value})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedQueries.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <button
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    onClick={() => {
                      alert(
                        `In der vollständigen Version würden hier Content-Vorschläge für die ausgewählten Keywords generiert: ${selectedQueries.join(', ')}`
                      )
                    }}
                  >
                    Content-Vorschläge für ausgewählte Keywords generieren
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
