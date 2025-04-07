import type { ReactNode } from 'react'
import { SidebarLinks } from './_components/SidebarLinks'

export const metadata = {
  title: 'Adminbereich - KOKOMO House',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="flex min-h-screen">
          <aside className="w-64 border-r bg-white p-6">
            <h1 className="mb-6 text-xl font-bold">⚙️ Adminbereich</h1>
            <SidebarLinks />
          </aside>
          <main className="flex-1 overflow-auto p-8">{children}</main>
        </div>
      </body>
    </html>
  )
}
