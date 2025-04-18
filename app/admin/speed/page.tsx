import PageSpeedCheck from '../_components/PageSpeed'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
        <PageSpeedCheck />
      </div>
    </div>
  )
}
