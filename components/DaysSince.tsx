'use client'

import { useState, useEffect } from 'react'

interface DaysSinceProps {
  startDate: string // Format: YYYY-MM-DD
  className?: string
}

const DaysSince: React.FC<DaysSinceProps> = ({ startDate, className = '' }) => {
  const [days, setDays] = useState<number>(0)

  useEffect(() => {
    const calculateDays = () => {
      const start = new Date(startDate)
      const today = new Date()

      // Zeit zurücksetzen, um nur die Tage zu zählen
      start.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)

      // Differenz in Millisekunden berechnen
      const diffTime = Math.abs(today.getTime() - start.getTime())
      // Umrechnen in Tage
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      setDays(diffDays)
    }

    calculateDays()

    // Optional: Täglich aktualisieren (um Mitternacht)
    const timer = setInterval(calculateDays, 86400000) // 24 Stunden

    return () => clearInterval(timer)
  }, [startDate])

  return <span className={className}>seit {days} Tagen</span>
}

export default DaysSince
