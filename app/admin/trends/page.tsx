import { Metadata } from 'next'
import Link from 'next/link'
import TrendActions from './_components/TrendActions'

export const metadata: Metadata = {
  title: 'Trend-Analyse Dashboard - Kokomo House',
  description: 'Dashboard zur Analyse aktueller Trends für die Content-Strategie',
}

export default function TrendsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Trend-Analyse Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Aktuelle Trends</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Entdecke die aktuellen Trends und populären Suchanfragen rund um Tiny Houses,
            Nachhaltigkeit und minimalistisches Wohnen.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/trends/dashboard"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Zum Trend-Dashboard →
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Content-Vorschläge</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Automatisch generierte Content-Ideen basierend auf aktuellen Trends und häufigen
            Nutzeranfragen.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/trends/content-ideas"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Zu den Content-Vorschlägen →
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Daten sammeln</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Starte manuell einen Datenlauf zur Sammlung aktueller Trends oder konfiguriere die
            automatische Datenerfassung.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/trends/collect"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Datensammlung starten →
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Systemstatus</h2>
        <p className="mb-2 text-gray-600 dark:text-gray-300">
          Hier kannst du den aktuellen Status des Trend-Analyse-Systems überprüfen und bei Bedarf
          die Datenbank oder den Scheduler neu initialisieren.
        </p>

        <TrendActions />
      </div>
    </div>
  )
}
