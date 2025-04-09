import MatomoStats from './_components/MatomoStats'
import MatomoMonthlyChart from './_components/MatomoMonthlyChart'
import TopPages from './_components/TopPages'
import MatomoAIAnalysis from './_components/MatomoAIAnalysis'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">🔍 AI SEO Analyse</h2>
        <MatomoAIAnalysis />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">📊 Besucherstatistik</h2>
        <MatomoStats />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">📈 Top Seiten</h2>
        <TopPages />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">📅 Besucher pro Monat</h2>
        <MatomoMonthlyChart />
      </div>
    </div>
  )
}
