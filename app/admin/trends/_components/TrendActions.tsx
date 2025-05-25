'use client'

import { useState } from 'react'

export default function TrendActions() {
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info')

  // System initialisieren
  const initializeSystem = async () => {
    setIsLoading(true)
    setStatusMessage('System wird initialisiert...')
    setStatusType('info')

    try {
      const response = await fetch('/api/trends/init', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setStatusMessage('System erfolgreich initialisiert!')
        setStatusType('success')
      } else {
        setStatusMessage(`Fehler: ${data.error || 'Unbekannter Fehler'}`)
        setStatusType('error')
      }
    } catch (error) {
      setStatusMessage(`Fehler bei der Initialisierung: ${error.message}`)
      setStatusType('error')
    } finally {
      setIsLoading(false)
    }
  }

  // Trends manuell sammeln
  const collectTrendsNow = async () => {
    setIsLoading(true)
    setStatusMessage('Trends werden gesammelt...')
    setStatusType('info')

    try {
      const response = await fetch('/api/trends', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setStatusMessage('Trends erfolgreich gesammelt!')
        setStatusType('success')
      } else {
        setStatusMessage(`Fehler: ${data.error || 'Unbekannter Fehler'}`)
        setStatusType('error')
      }
    } catch (error) {
      setStatusMessage(`Fehler bei der Trendsammlung: ${error.message}`)
      setStatusType('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-4">
        <button
          className={`rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
          onClick={initializeSystem}
          disabled={isLoading}
        >
          {isLoading ? 'Wird ausgeführt...' : 'System initialisieren'}
        </button>

        <button
          className={`rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
          onClick={collectTrendsNow}
          disabled={isLoading}
        >
          {isLoading ? 'Wird ausgeführt...' : 'Trends jetzt sammeln'}
        </button>
      </div>

      {statusMessage && (
        <div
          className={`mt-4 rounded p-3 ${
            statusType === 'success'
              ? 'bg-green-100 text-green-800'
              : statusType === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
          }`}
        >
          {statusMessage}
        </div>
      )}
    </div>
  )
}
