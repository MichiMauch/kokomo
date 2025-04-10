import PageSpeedCheck from '../_components/PageSpeed'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">⚡ PageSpeed Test</h2>
        <PageSpeedCheck />
      </div>
    </div>
  )
}
