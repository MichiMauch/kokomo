// app/admin/content-strategie/page.tsx
'use client'

import { useEffect, useState } from 'react'
import ContentIdeaGenerator from '../_components/ContentIdeaGenerator'

type Row = {
  keys: string[]
  clicks: number
  impressions: number
}

export default function ContentStrategiePage() {
  const [keywords, setKeywords] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKeywords = async () => {
      const res = await fetch('/api/searchconsole?range=28d&type=query')
      const data = await res.json()
      const topKeywords = (data.rows || []).map((row: Row) => row.keys[0])
      setKeywords(topKeywords)
      setLoading(false)
    }

    fetchKeywords()
  }, [])

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">🧠 Content Strategie</h2>
        <p className="mb-4 text-gray-600">
          Generiere mit einem Klick neue Content-Ideen basierend auf realen Suchbegriffen.
        </p>

        {loading ? <p>Lade Suchbegriffe...</p> : <ContentIdeaGenerator keywords={keywords} />}
      </div>
    </div>
  )
}
