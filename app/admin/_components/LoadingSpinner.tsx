// components/LoadingSpinner.tsx
'use client'

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      <div className="text-center">
        <p className="text-lg font-semibold text-indigo-700">Analyse wird vorbereitet…</p>
        <p className="text-sm text-gray-500">
          Wir werten die Matomo-Daten aus und generieren Insights.
        </p>
      </div>
    </div>
  )
}
