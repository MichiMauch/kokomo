'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, Typography } from '@material-tailwind/react'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import type { ApexOptions } from 'apexcharts'

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

type MonthlyData = {
  label: string
  value: number
}

export default function MatomoMonthlyChart() {
  const [data, setData] = useState<MonthlyData[]>([])
  const [mode, setMode] = useState<'monthly' | 'daily'>('monthly')

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`../api/monthly?mode=${mode}`)
      const json: MonthlyData[] = await res.json()
      setData(json)
    }

    fetchData()
  }, [mode])

  const labels = data.map((item) => item.label)
  const values = data.map((item) => item.value)

  const chartOptions: ApexOptions = {
    series: [{ name: 'Besucher', data: values }],
    chart: {
      type: 'bar',
      height: 240,
      toolbar: { show: false },
    },
    title: { text: '' },
    dataLabels: { enabled: false },
    colors: ['#020617'],
    plotOptions: {
      bar: {
        columnWidth: '40%',
        borderRadius: 2,
      },
    },
    xaxis: {
      categories: labels,
      labels: {
        style: {
          colors: '#616161',
          fontSize: '12px',
          fontFamily: 'inherit',
          fontWeight: 400,
        },
      },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#616161',
          fontSize: '12px',
          fontFamily: 'inherit',
          fontWeight: 400,
        },
      },
    },
    grid: {
      show: true,
      borderColor: '#dddddd',
      strokeDashArray: 5,
      xaxis: { lines: { show: true } },
      padding: { top: 5, right: 20 },
    },
    fill: { opacity: 0.8 },
    tooltip: { theme: 'dark' },
  }

  return (
    <Card className="bg-white text-gray-700 shadow-md">
      <CardBody>
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-lg bg-gray-900 p-3 text-white">
            <ChartBarIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <Typography variant="h6" color="blue-gray">
              Besucherstatistik
            </Typography>
            <Typography variant="small" className="text-gray-700">
              {mode === 'monthly'
                ? 'Letzte 12 Monate'
                : `Monat ${new Date().toLocaleString('de-CH', { month: 'long' })} – täglich`}
            </Typography>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('monthly')}
              className={`rounded px-3 py-1 text-sm font-medium ${mode === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Monat
            </button>
            <button
              onClick={() => setMode('daily')}
              className={`rounded px-3 py-1 text-sm font-medium ${mode === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Tag
            </button>
          </div>
        </div>

        {values.length > 0 && (
          <ApexChart options={chartOptions} series={chartOptions.series} type="bar" height={240} />
        )}
      </CardBody>
    </Card>
  )
}
