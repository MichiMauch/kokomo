'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMdxDraft } from '@/components/context/mdx-draft-context'
import SpinnerModal from '../_components/SpinnerModal'
import { Textarea } from '@/components/ui/textarea'

export const dynamic = 'force-dynamic'

export default function AgentPage() {
  const [title, setTitle] = useState('')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [autoStart, setAutoStart] = useState(false)
  const router = useRouter()
  const { setDraftData } = useMdxDraft()

  const handleCreatePlan = useCallback(async () => {
    if (!title) {
      console.error('❌ Kein Titel angegeben!')
      return
    }

    console.log('🚀 handleCreatePlan gestartet mit Titel:', title)
    setLoading(true)
    setPlan(null)

    try {
      const res = await fetch('/api/agent-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!res.ok) {
        throw new Error(`Fehler beim Abrufen der Strategie: ${res.statusText}`)
      }

      const json = await res.json()
      console.log('📦 Antwort von /api/agent-plan:', json)
      setPlan(json)
    } catch (err) {
      console.error('❌ Fehler bei /api/agent-plan:', err)
    } finally {
      setLoading(false)
    }
  }, [title])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const presetTitle = urlParams.get('title') || ''
    console.log('🔍 titleFromQuery (window.location.search):', presetTitle)
    if (presetTitle) {
      console.log('✅ presetTitle erkannt:', presetTitle)
      setTitle(presetTitle)
      setAutoStart(true)
    }
  }, [])

  useEffect(() => {
    console.log(
      '🔄 Zustand: autoStart:',
      autoStart,
      'title:',
      title,
      'plan:',
      plan,
      'loading:',
      loading
    )
    if (autoStart && title && !plan && !loading) {
      console.log('🧠 Starte handleCreatePlan() automatisch')
      handleCreatePlan()
      setAutoStart(false)
    }
  }, [autoStart, title, plan, loading, handleCreatePlan])

  const handleGenerateText = async () => {
    if (!plan) return
    setGenerating(true)

    try {
      // Verwende unsere eigene API-Route statt direkt OpenAI aufzurufen
      const res = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          plan,
        }),
      })

      if (!res.ok) {
        throw new Error(`Fehler beim Abrufen der Daten: ${res.statusText}`)
      }

      const data = await res.json()
      console.log('📝 Text generiert:', data)

      setDraftData({
        title,
        date: new Date().toISOString().split('T')[0],
        draft: true,
        body: data.content || '',
      })

      router.push(`/admin/create?title=${encodeURIComponent(title)}`)
    } catch (err) {
      console.error('❌ Fehler beim Text generieren:', err)
    } finally {
      setGenerating(false)
    }
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
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">Strategie bearbeiten</h2>
            <div>
              <label htmlFor="ziel" className="mb-1 block text-sm font-medium text-gray-700">
                Ziel
              </label>
              <Textarea
                id="ziel"
                value={plan.ziel}
                onChange={(e) => setPlan({ ...plan, ziel: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="zielgruppe" className="mb-1 block text-sm font-medium text-gray-700">
                Zielgruppe
              </label>
              <Textarea
                id="zielgruppe"
                value={plan.zielgruppe}
                onChange={(e) => setPlan({ ...plan, zielgruppe: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="gliederung" className="mb-1 block text-sm font-medium text-gray-700">
                Gliederung (eine Zeile pro Punkt)
              </label>
              <Textarea
                id="gliederung"
                value={plan.gliederung.join('\n')}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    gliederung: e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full"
              />
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
