// SidebarLinks.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function SidebarLinks() {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetchPending = async () => {
      const res = await fetch('/api/github-comments')
      const data = await res.json()
      interface Comment {
        body: string
      }

      const pending = data.filter((comment: Comment) => comment.body.includes('[PENDING]'))
      setPendingCount(pending.length)
    }

    fetchPending()
  }, [])

  const links: { href: string; label: React.ReactNode }[] = [
    { href: '/admin/', label: '📉 Dashboard' },
    { href: '/admin/create', label: '✍️ Neuer Post' },
    { href: '/admin/posts', label: '📄 Alle Beiträge' },
    { href: '/admin/speed', label: '⚡ PageSpeed Test' },
    { href: '/admin/seo', label: '🔍 Suchbegriffe' },
    { href: '/admin/strategie', label: '🧠 Content Ideen' },
    {
      href: '/admin/comments',
      label: (
        <span className="flex items-center justify-between">
          💬 Kommentare
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
              {pendingCount}
            </span>
          )}
        </span>
      ),
    },
    { href: '/admin/deploy', label: '🔁 Deploy-Status' },
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
