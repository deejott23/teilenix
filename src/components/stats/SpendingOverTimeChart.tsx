'use client'

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { formatCurrency, formatDate } from '@/lib/formatting'

interface SpendingOverTimeChartProps {
  data: { date: string; cumulative: number; amount: number }[]
}

export default function SpendingOverTimeChart({ data }: SpendingOverTimeChartProps) {
  const chartData = data.map(d => ({
    ...d,
    date: formatDate(d.date),
    cumulativeDisplay: d.cumulative / 100,
  }))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={(v: number) => `€${v}`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [formatCurrency(Number(value) * 100), 'Kumulativ']}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          />
          <Line
            type="monotone"
            dataKey="cumulativeDisplay"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ fill: '#22c55e', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
