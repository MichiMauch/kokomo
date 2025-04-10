// components/LoadingSpinner.tsx
'use client'

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className="border-primary-600 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      <div className="text-center">
        <p className="text-primary-700 text-lg font-semibold">Analyse wird vorbereitet…</p>
        <p className="text-sm text-gray-500">Wir werten die Daten aus und generieren Insights.</p>
      </div>
    </div>
  )
}
