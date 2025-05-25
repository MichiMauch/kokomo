// SidebarLinks.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

export function SidebarLinks() {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Initialisiere expandierte Menüs basierend auf dem aktuellen Pfad
    const currentPath = pathname

    // Wenn der aktuelle Pfad ein Untermenü ist, expandiere das übergeordnete Menü
    if (
      currentPath.includes('/admin/prompt-generator') ||
      currentPath.includes('/admin/saved-prompts')
    ) {
      setExpandedMenus((prev) => ({ ...prev, 'prompt-generator': true }))
    }

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
  }, [pathname])

  // Toggle-Funktion für Untermenüs
  const toggleSubmenu = (key: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Definiere die Links-Struktur mit Unterstützung für Untermenüs
  const links = [
    { href: '/admin/', label: '📉 Dashboard' },
    { href: '/admin/create', label: '✍️ Neuer Post' },
    { href: '/admin/posts', label: '📄 Alle Beiträge' },
    {
      key: 'prompt-generator',
      label: '🖼️ Bild-Prompt Generator',
      href: '/admin/prompt-generator',
      submenu: [{ href: '/admin/saved-prompts', label: '💾 Gespeicherte Prompts' }],
    },
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
    <nav className="space-y-1">
      {links.map((link) => {
        // Prüfen, ob es sich um ein Link-Objekt mit Untermenü handelt
        if ('submenu' in link && link.submenu) {
          const isActive =
            pathname === link.href || link.submenu.some((sublink) => pathname === sublink.href)
          const isExpanded = expandedMenus[link.key as string]

          return (
            <div key={link.key as string}>
              <div className="flex w-full items-center">
                <Link
                  href={link.href as string}
                  className={cn(
                    'flex-grow rounded px-3 py-2 text-sm font-medium hover:bg-gray-100',
                    pathname === link.href ? 'bg-gray-100 text-blue-600' : 'text-gray-800'
                  )}
                >
                  {link.label}
                </Link>
                <button
                  onClick={() => toggleSubmenu(link.key as string)}
                  className="mr-2 rounded p-1 hover:bg-gray-100"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>

              {/* Untermenü-Links */}
              {isExpanded && (
                <div className="mt-1 ml-6 space-y-1">
                  {link.submenu.map((sublink) => (
                    <Link
                      key={sublink.href}
                      href={sublink.href}
                      className={cn(
                        'block rounded px-3 py-2 text-sm font-medium hover:bg-gray-100',
                        pathname === sublink.href ? 'bg-gray-100 text-blue-600' : 'text-gray-800'
                      )}
                    >
                      {sublink.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        }

        // Standard-Link ohne Untermenü
        return (
          <Link
            key={link.href as string}
            href={link.href as string}
            className={cn(
              'block rounded px-3 py-2 text-sm font-medium hover:bg-gray-100',
              pathname === link.href ? 'bg-gray-100 text-blue-600' : 'text-gray-800'
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
