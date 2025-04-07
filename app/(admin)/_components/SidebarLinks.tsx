'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function SidebarLinks() {
  const pathname = usePathname()
  const links = [
    { href: '/admin/create', label: '🆕 Neuer Post' },
    { href: '/admin/posts', label: '📂 Alle Beiträge' },
    { href: '/admin/deploy', label: '🔁 Deploy-Status' }, // 👈 NEU
  ]

  return (
    <nav className="space-y-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'block rounded px-3 py-2 text-sm font-medium hover:bg-gray-100',
            pathname === link.href ? 'bg-gray-100 text-blue-600' : 'text-gray-800'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
