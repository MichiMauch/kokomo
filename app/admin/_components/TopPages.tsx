'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, Typography } from '@material-tailwind/react'
import { ListBulletIcon } from '@heroicons/react/24/outline'

type Page = {
  label: string
  hits: number
}

const PERIODS = [
  { label: 'Heute', value: 'day' },
  { label: 'Letzte 7 Tage', value: 'last7' },
  { label: 'Letzte 28 Tage', value: 'last28' },
]

export default function TopPages() {
  const [pages, setPages] = useState<Page[]>([])
  const [range, setRange] = useState('day')

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/admin/api/top-pages?range=${range}`)
      const data = await res.json()
      setPages(data)
    }

    fetchData()
  }, [range])

  return (
    <Card className="bg-white text-gray-700 shadow-md">
      <CardBody>
        <div className="mb-6 flex items-center gap-4">
          <div className="bg-primary-500 rounded-lg p-3 text-white">
            <ListBulletIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <Typography variant="h6" color="blue-gray">
              Meistbesuchte Seiten
            </Typography>
            <Typography variant="small" className="text-gray-700">
              {range === 'day' ? 'Heute' : range === 'last7' ? 'Letzte 7 Tage' : 'Letzte 28 Tage'}
            </Typography>
          </div>
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setRange(p.value)}
                className={`rounded px-3 py-1 text-sm font-medium ${
                  range === p.value ? 'bg-secondary-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden ring-1 ring-black/5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Seite</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Seitenaufrufe
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pages.map((page, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-700">
                    {page.label}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-700">{page.hits}</td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-500" colSpan={2}>
                    Keine Daten gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}
