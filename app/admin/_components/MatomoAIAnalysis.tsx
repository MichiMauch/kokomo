'use client'

import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'

const PERIODS = [
  { label: '7 Tage', value: '7' },
  { label: '28 Tage', value: '28' },
  { label: '3 Monate', value: '90' },
  { label: '6 Monate', value: '180' },
  { label: '1 Jahr', value: '365' },
]

export default function MatomoGptAnalyzer() {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  const handleAnalyze = async (period: string) => {
    setLoading(true)
    setAnalysis('')
    setHasAnalyzed(true)

    try {
      console.log('🧪 Analyse starten für Zeitraum:', period)
      const res = await fetch('/api/analyze-matomo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('❌ Fehlerhafte Antwort:', errorText)
        throw new Error('Antwort war nicht OK')
      }

      const data = await res.json()
      console.log('✅ Analyse erhalten:', data.analysis)
      setAnalysis(data.analysis || 'Keine Analyse erhalten.')
    } catch (err) {
      setAnalysis('Fehler bei der Analyse.')
      console.error('❌ Analyse-Fehler:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="font-medium text-gray-700">Wähle einen Zeitraum für die Analyse aus:</p>

        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handleAnalyze(p.value)}
              className="bg-secondary-500 hover:bg-secondary-300 rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {hasAnalyzed && (
        <div className="mt-4 rounded-md border border-gray-200 bg-white p-4 shadow">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div
              className="prose max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: analysis }}
            />
          )}
        </div>
      )}
    </div>
  )
}
