'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import { useMdxDraft } from '@/components/context/mdx-draft-context'

type Props = {
  keywords: string[]
}

export default function ContentIdeaGenerator({ keywords }: Props) {
  const [ideas, setIdeas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const { setDraftData } = useMdxDraft()
  const router = useRouter()

  const generateIdeas = async () => {
    setLoading(true)
    setIdeas([])

    const res = await fetch('/api/generate-content-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords }),
    })

    const data = await res.json()
    setIdeas(data.ideas || [])
    setLoading(false)
  }

  const handleUseIdea = (idea: string) => {
    const today = new Date().toISOString().split('T')[0]
    const cleanTitle = idea
      .replace(/^[-*\d.]+\s*/, '') // entfernt "1. ", "* ", "- ", etc.
      .replace(/^["“]|["”]$/g, '') // entfernt Anführungszeichen
      .trim()
    const newDraft = {
      title: cleanTitle,
      date: today,
      draft: true,
    }

    console.log('✅ setDraftData wird gesetzt:', newDraft)
    setDraftData(newDraft)

    setTimeout(() => {
      router.push(`/admin/create?title=${encodeURIComponent(cleanTitle)}`)
    }, 100)
  }

  return (
    <div className="mt-8 space-y-4">
      <button
        onClick={generateIdeas}
        className="bg-secondary-500 hover:bg-secondary-300 cursor-pointer rounded-md px-4 py-2 font-medium text-white"
      >
        🪄 Content-Ideen generieren
      </button>

      {loading && (
        <div className="flex flex-col items-center justify-center py-6">
          <LoadingSpinner />
          <p className="mt-2 text-sm text-gray-500">Ideen werden subito generiert…</p>
        </div>
      )}

      {ideas.length > 0 && (
        <div className="space-y-3">
          {ideas.map((idea, i) => (
            <div key={i} className="flex items-start justify-between gap-4 border-b pb-2">
              <p className="text-gray-800">{idea}</p>
              <button
                onClick={() => handleUseIdea(idea)}
                className="text-sm text-blue-600 hover:underline"
              >
                📄 im Editor öffnen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
