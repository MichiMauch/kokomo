import SearchConsoleList from '../_components/SearchConsoleList'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
        <SearchConsoleList />
      </div>
    </div>
  )
}
