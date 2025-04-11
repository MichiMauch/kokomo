'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMdxDraft } from '@/components/context/mdx-draft-context'
import SpinnerModal from '../_components/SpinnerModal'

export default function AgentPage() {
  const searchParams = useSearchParams()
  const presetTitle = searchParams.get('title') || ''

  const [title, setTitle] = useState(presetTitle)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [autoStart, setAutoStart] = useState(false)
  const router = useRouter()
  const { setDraftData } = useMdxDraft()

  useEffect(() => {
    if (presetTitle) {
      setAutoStart(true)
    }
  }, [presetTitle])

  useEffect(() => {
    if (autoStart && title && !plan && !loading) {
      handleCreatePlan()
      setAutoStart(false)
    }
  }, [autoStart, title, plan, loading])

  const handleCreatePlan = async () => {
    setLoading(true)
    setPlan(null)

    const res = await fetch('/api/agent-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })

    const json = await res.json()
    setPlan(json)
    setLoading(false)
  }

  const handleGenerateText = async () => {
    if (!plan) return
    setGenerating(true)

    const res = await fetch('/api/agent-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, plan }),
    })

    const data = await res.json()

    setDraftData({
      title,
      date: new Date().toISOString().split('T')[0],
      draft: true,
      body: data.body,
    })

    router.push(`/admin/create?title=${encodeURIComponent(title)}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">🧠 AI Content-Strategie</h1>

      <div className="space-y-2">
        <label htmlFor="title-input" className="block font-medium text-gray-700">
          Arbeitstitel
        </label>
        <input
          id="title-input"
          type="text"
          className="w-full rounded border px-4 py-2 text-sm"
          placeholder="z. B. Was ist ein Bauvisier?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          onClick={handleCreatePlan}
          disabled={!title || loading}
          className="bg-primary-500 hover:bg-primary-300 mt-2 rounded px-4 py-2 text-sm font-medium text-white"
        >
          {loading ? '🧠 Strategie wird erstellt…' : '🚀 Strategie erstellen'}
        </button>
      </div>

      {plan && (
        <div className="space-y-4 rounded border bg-white p-4 shadow">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Strategie</h2>
            <p className="mb-4 text-sm text-gray-600">
              <strong>Ziel:</strong> {plan.ziel}
              <br />
              <strong>Zielgruppe:</strong> {plan.zielgruppe}
            </p>
            <div>
              <p className="mb-1 font-medium text-gray-700">🔹 Gliederung:</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-800">
                {plan.gliederung.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={handleGenerateText}
            disabled={generating}
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            {generating ? '✍️ Text wird generiert…' : '✍️ Text generieren & übernehmen'}
          </button>
        </div>
      )}

      {(loading || generating) && (
        <SpinnerModal text={loading ? '🧠 Strategie wird erstellt…' : '✍️ Text wird generiert…'} />
      )}
    </div>
  )
}

interface Plan {
  ziel: string
  zielgruppe: string
  gliederung: string[]
}
