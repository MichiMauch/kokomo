// Dieses Template wird NUR für /admin/* Seiten verwendet
import type React from 'react'
import { Toaster } from 'sonner'
import { SidebarLinks } from './_components/SidebarLinks'

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r bg-white p-6">
          <h1 className="mb-6 text-xl font-bold">⚙️ Adminbereich</h1>
          <SidebarLinks />
        </aside>
        <main className="flex-1 overflow-auto p-8">
          <Toaster />
          {children}
        </main>
      </div>
    </div>
  )
}
