'use client'

import { useState } from 'react'
import Link from 'next/link'

type ContentSuggestion = {
  id: number
  title: string
  description: string
  trendKeywords: string
  status: string
}

// Beispiel-Content-Vorschläge
const EXAMPLE_SUGGESTIONS: ContentSuggestion[] = [
  {
    id: 1,
    title: 'Tiny House Finanzierung: Welche Banken bieten spezielle Kredite?',
    description:
      "Basierend auf steigendem Suchvolumen zum Thema 'Tiny House Finanzierung'. Nutzer suchen nach konkreten Finanzierungsmöglichkeiten.",
    trendKeywords: 'tiny house finanzierung, tiny house kredit, tiny house bank',
    status: 'new',
  },
  {
    id: 2,
    title: 'Autarkes Wohnen im Winter: So funktioniert die Energieversorgung',
    description:
      'Saisonaler Trend: Mit Beginn der kalten Jahreszeit steigt das Interesse an Energieversorgung für autarke Häuser.',
    trendKeywords: 'autarkie winter, off grid heizen, solar winter',
    status: 'new',
  },
  {
    id: 3,
    title: 'Die 10 besten Tiny House Grundstücke in Deutschland',
    description: 'Hohe Nachfrage nach Informationen zu legalen Stellplätzen für Tiny Houses.',
    trendKeywords: 'tiny house grundstück, wo darf man tiny house stellen, tiny house stellplatz',
    status: 'active',
  },
]

export default function ContentIdeasPage() {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>(EXAMPLE_SUGGESTIONS)
  const [selectedSuggestion, setSelectedSuggestion] = useState<ContentSuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Status für einen Content-Vorschlag ändern
  const updateStatus = (id: number, newStatus: string) => {
    setSuggestions((prev) =>
      prev.map((suggestion) =>
        suggestion.id === id ? { ...suggestion, status: newStatus } : suggestion
      )
    )
  }

  // Content-Vorschlag generieren (wird in Zukunft mit OpenAI API implementiert)
  const generateContent = async (suggestionId: number) => {
    setIsLoading(true)
    // In Zukunft: Hier API-Aufruf an OpenAI oder einen ähnlichen Dienst

    // Simuliere Ladezeit
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    alert('Diese Funktion wird in einer späteren Version implementiert.')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Content-Vorschläge</h1>
        <Link href="/admin/trends" className="text-blue-600 hover:underline dark:text-blue-400">
          Zurück zur Übersicht
        </Link>
      </div>

      {/* Content-Vorschläge */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Aktuelle Vorschläge</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <h3 className="mb-2 text-lg font-medium">{suggestion.title}</h3>
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                {suggestion.description}
              </p>

              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Trend-Keywords:
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {suggestion.trendKeywords.split(', ').map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    suggestion.status === 'new'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : suggestion.status === 'active'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}
                >
                  {suggestion.status === 'new'
                    ? 'Neu'
                    : suggestion.status === 'active'
                      ? 'In Bearbeitung'
                      : 'Abgeschlossen'}
                </span>

                <div className="flex gap-2">
                  <button
                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                    onClick={() => generateContent(suggestion.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Wird generiert...' : 'Inhalt generieren'}
                  </button>

                  <select
                    className="rounded border bg-white p-1 text-sm dark:bg-gray-700"
                    value={suggestion.status}
                    onChange={(e) => updateStatus(suggestion.id, e.target.value)}
                  >
                    <option value="new">Neu</option>
                    <option value="active">In Bearbeitung</option>
                    <option value="completed">Abgeschlossen</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hinweis für Demo-Daten */}
        <div className="mt-6 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          <p>
            <strong>Hinweis:</strong> Dies sind Demo-Vorschläge. In der vollständigen Version werden
            hier automatisch generierte Content-Vorschläge basierend auf den gesammelten Trend-Daten
            angezeigt.
          </p>
        </div>
      </div>

      {/* Einstellungen */}
      <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Einstellungen</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-medium">Content-Generierung</h3>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="autoSuggestion"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Automatische Vorschläge
                </label>
                <select
                  id="autoSuggestion"
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                  defaultValue="weekly"
                >
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                  <option value="off">Deaktiviert</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="relevanceThreshold"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Relevanz-Schwellenwert
                </label>
                <input
                  id="relevanceThreshold"
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="70"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mehr Vorschläge</span>
                  <span>Höhere Relevanz</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-medium">Benachrichtigungen</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="notify-email"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  defaultChecked
                />
                <label
                  htmlFor="notify-email"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  E-Mail-Benachrichtigungen bei neuen Vorschlägen
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="notify-dashboard"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  defaultChecked
                />
                <label
                  htmlFor="notify-dashboard"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Dashboard-Benachrichtigungen
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={() => alert('Einstellungen gespeichert (Demo)')}
          >
            Einstellungen speichern
          </button>
        </div>
      </div>
    </div>
  )
}
