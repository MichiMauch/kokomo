import MatomoStats from '../_components/MatomoStats'
import MatomoMonthlyChart from '../_components/MatomoMonthlyChart'
import TopPages from '../_components/TopPages'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Hier kommt das Dashboard</h1>
      <MatomoStats />
      <TopPages />
      <MatomoMonthlyChart />
    </div>
  )
}
