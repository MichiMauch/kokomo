import MatomoStats from './_components/MatomoStats'
import MatomoMonthlyChart from './_components/MatomoMonthlyChart'
import TopPages from './_components/TopPages'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <MatomoStats />
      <TopPages />
      <MatomoMonthlyChart />
    </div>
  )
}
