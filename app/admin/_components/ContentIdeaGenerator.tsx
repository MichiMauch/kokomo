'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMdxDraft } from '@/components/context/mdx-draft-context'
import SpinnerModal from './SpinnerModal'
import LoadingSpinner from './LoadingSpinner'

type Props = {
  keywords: string[]
}

export default function ContentIdeaGenerator({ keywords }: Props) {
  const [ideas, setIdeas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)

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

  const handleUseIdea = async (idea: string, index: number) => {
    setGeneratingIndex(index)

    try {
      const today = new Date().toISOString().split('T')[0]
      const cleanTitle = idea
        .replace(/^[-*\d.]+\s*/, '')
        .replace(/^["“]|["”]$/g, '')
        .trim()

      const contentRes = await fetch('/api/generate-post-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: cleanTitle }),
      })

      const contentJson = await contentRes.json()
      const body = contentJson.body || ''

      setDraftData({
        title: cleanTitle,
        date: today,
        draft: true,
        body,
      })

      router.push(`/admin/create?title=${encodeURIComponent(cleanTitle)}`)
    } catch (err) {
      console.error('Fehler beim Generieren des Inhalts:', err)
    } finally {
      setGeneratingIndex(null)
    }
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
                onClick={() => handleUseIdea(idea, i)}
                className="bg-primary-500 hover:bg-primary-300 flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white"
              >
                <span>📄</span>
                <span>Inhalt erstellen</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {generatingIndex !== null && <SpinnerModal text="🛠️ Entwurf wird erstellt…" />}
    </div>
  )
}
