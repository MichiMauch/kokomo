'use client'

import { useEffect, useState } from 'react'
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid'
import { CursorArrowRaysIcon, UsersIcon, XCircleIcon } from '@heroicons/react/24/outline'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const PERIODS = [
  { label: 'Heute', value: 'day' },
  { label: 'Letzte 7 Tage', value: 'last7' },
  { label: 'Letzte 28 Tage', value: 'last28' },
]

export default function MatomoStats() {
  interface Stat {
    id: number
    name: string
    stat: number
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    change: string
    changeType: 'increase' | 'decrease'
  }

  const [stats, setStats] = useState<Stat[] | null>(null)
  const [period, setPeriod] = useState('day') // Default: heute
  const [loading, setLoading] = useState(false)

  const toPercentChange = (now: number, prev: number) => {
    if (!prev || typeof prev !== 'number') return ''
    const diff = ((now - prev) / prev) * 100
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`
  }

  const formatSeconds = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')} min`
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const res = await fetch(`/admin/api/matomo?range=${period}`, { method: 'POST' })
      const contentType = res.headers.get('content-type')
      if (!res.ok || !contentType?.includes('application/json')) {
        console.error('Fehler beim Laden der Matomo-Daten')
        setStats(null)
        setLoading(false)
        return
      }
      const data = await res.json()
      setStats([
        {
          id: 1,
          name: 'Besucher',
          stat: data.visitors.now,
          icon: UsersIcon,
          change: toPercentChange(data.visitors.now, data.visitors.prev),
          changeType: data.visitors.now >= data.visitors.prev ? 'increase' : 'decrease',
        },
        {
          id: 2,
          name: 'Seitenansichten',
          stat: data.pageviews.now,
          icon: CursorArrowRaysIcon,
          change: toPercentChange(data.pageviews.now, data.pageviews.prev),
          changeType: data.pageviews.now >= data.pageviews.prev ? 'increase' : 'decrease',
        },
        {
          id: 3,
          name: 'Eindeutige Seitenansichten',
          stat: data.unique_pageviews.now,
          icon: XCircleIcon,
          change: toPercentChange(data.unique_pageviews.now, data.unique_pageviews.prev),
          changeType:
            data.unique_pageviews.now >= data.unique_pageviews.prev ? 'increase' : 'decrease',
        },
        {
          id: 4,
          name: 'Ø Verweildauer',
          stat: formatSeconds(data.avg_time_on_site.now),
          icon: CursorArrowRaysIcon,
          change: toPercentChange(data.avg_time_on_site.now, data.avg_time_on_site.prev),
          changeType:
            data.avg_time_on_site.now >= data.avg_time_on_site.prev ? 'increase' : 'decrease',
        },
      ])
      setLoading(false)
    }

    fetchData()
  }, [period])

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={classNames(
              period === p.value
                ? 'bg-secondary-500 text-white'
                : 'bg-white text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50',
              'rounded-md px-4 py-2 text-sm font-medium shadow-sm transition'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Lade Daten…</p>}

      {!loading && stats && (
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {stats.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
            >
              <dt>
                <div className="bg-primary-500 absolute rounded-md p-3">
                  <item.icon className="size-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
              </dt>
              <dd className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                {item.change && (
                  <p
                    className={classNames(
                      item.changeType === 'increase' ? 'text-green-600' : 'text-red-600',
                      'ml-2 flex items-baseline text-sm font-semibold'
                    )}
                  >
                    {item.changeType === 'increase' ? (
                      <ArrowUpIcon
                        className="size-5 shrink-0 self-center text-green-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <ArrowDownIcon
                        className="size-5 shrink-0 self-center text-red-500"
                        aria-hidden="true"
                      />
                    )}
                    {item.change}
                  </p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
