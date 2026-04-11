'use client'

import dynamic from 'next/dynamic'

// Recharts (~300KB) wird erst geladen wenn diese Komponente sichtbar wird
export const SpendingByCategoryChart = dynamic(() => import('./SpendingByCategoryChart'), {
  ssr: false,
  loading: () => <div className="bg-card card-shadow rounded-2xl p-4 h-[252px] animate-pulse" />,
})

export const SpendingOverTimeChart = dynamic(() => import('./SpendingOverTimeChart'), {
  ssr: false,
  loading: () => <div className="bg-card card-shadow rounded-2xl p-4 h-[232px] animate-pulse" />,
})
