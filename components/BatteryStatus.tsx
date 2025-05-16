'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

// Keine bedingten Variablen, die zwischen Server und Client variieren könnten
export default function BatteryStatus({ className = '' }) {
  const [batteryCharge, setBatteryCharge] = useState<number>(82) // Default-Wert als Fallback
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchBatteryStatus = async () => {
      try {
        // Direkt auf unsere aktualisierte API zugreifen
        const res = await fetch('/api/battery-status', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
          // Längeres Timeout, um sicherzustellen, dass die Anfrage Zeit hat
          signal: AbortSignal.timeout(8000),
        })

        if (!res.ok) {
          throw new Error(`API-Fehler: ${res.status}`)
        }

        const data = await res.json()

        // Prüfen, ob die Daten direkt als Antwort kommen oder als Rohdaten von Victron
        if (data.batteryCharge !== null && data.batteryCharge !== undefined) {
          // Direkter Wert aus unserem API-Endpunkt
          const value = Number(data.batteryCharge)
          if (!isNaN(value)) {
            setBatteryCharge(value)
            setError(null)
          } else {
            setError('Ungültiger Wert')
          }
        } else if (data.records?.bs && data.records.bs.length > 0) {
          // Rohdaten direkt von der Victron API
          const lastBatteryEntry = data.records.bs[data.records.bs.length - 1]
          // Das zweite Element (Index 1) enthält den Ladezustand
          const charge = lastBatteryEntry[1]
          const value = Number(charge)
          if (!isNaN(value)) {
            setBatteryCharge(value)
            setError(null)
          } else {
            setError('Ungültiger Rohdatenwert')
          }
        } else {
          setError('Keine Batteriedaten in der Antwort')
        }
      } catch (error) {
        setError(`Fehler beim Laden: ${error.message}`)

        // Bei einem Fehler behalten wir den aktuellen Wert bei
      } finally {
        setLoading(false)
      }
    }

    fetchBatteryStatus()

    // Alle 5 Minuten aktualisieren
    const interval = setInterval(fetchBatteryStatus, 300000)

    return () => clearInterval(interval)
  }, [])

  // Fixe Werte für Server- und Client-Rendering, um Hydration-Probleme zu vermeiden
  const title = 'Aktueller Batterieladezustand'

  // Einfaches Rendering ohne bedingte Logik
  return (
    <span className={`${className} flex items-center gap-1 text-gray-500`} title={title}>
      <Image
        src="/static/images/battery-full.svg"
        width={16}
        height={16}
        alt="Batterie"
        className="inline-block text-gray-500"
        style={{ filter: 'invert(50%)' }} // Diese Technik macht das schwarze SVG grau
      />
      {Math.round(batteryCharge)}%
    </span>
  )
}
