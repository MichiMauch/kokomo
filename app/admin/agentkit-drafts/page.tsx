'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

export default function AgentKitDraftsPage() {
  const [topic, setTopic] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!topic.trim()) {
      toast.error('Bitte geben Sie ein Thema ein')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/agentkit/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), summary: summary.trim() || undefined }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || errorData?.message || res.statusText)
      }

      const data = await res.json()

      if (data.success) {
        setResult(data.agent_output)
        toast.success('Agent-Anfrage erfolgreich')
      } else {
        throw new Error(data.message || 'Unbekannter Fehler')
      }
    } catch (error) {
      console.error('❌ Fehler beim Aufruf der AgentKit API:', error)
      toast.error('Fehler beim Aufruf der API', {
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🤖 AgentKit Draft Manager</h1>
        <p className="mt-2 text-sm text-gray-600">
          Erstellen oder finden Sie MDX-Drafts mit Hilfe von KI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow">
        <div>
          <label htmlFor="topic" className="mb-2 block text-sm font-medium text-gray-700">
            Thema / Topic
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z.B. Regenwasser im Tiny House"
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="summary" className="mb-2 block text-sm font-medium text-gray-700">
            Zusammenfassung (Optional)
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Optional: Kurze Beschreibung des Themas..."
            rows={3}
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? '🔄 Agent arbeitet...' : '🚀 Draft erstellen/finden'}
        </button>
      </form>

      {result && (
        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-6 shadow">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <h2 className="text-lg font-semibold text-green-900">Agent-Antwort</h2>
          </div>
          <div className="rounded-md bg-white p-4 text-sm text-gray-800">
            <pre className="font-sans whitespace-pre-wrap">{result}</pre>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm text-blue-900">Agent arbeitet an Ihrer Anfrage...</span>
        </div>
      )}
    </div>
  )
}
