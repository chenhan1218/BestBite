import { STATUS_COLORS, STATISTICS_CARD } from '@/styles/themes'

interface StatisticsCardProps {
  count: number
  label: string
  status: 'red' | 'yellow' | 'green'
}

export function StatisticsCard({ count, label, status }: StatisticsCardProps) {
  const colors = STATUS_COLORS[status]

  return (
    <div className={`p-4 ${colors.bg} rounded-lg`}>
      <div className={`${STATISTICS_CARD.number} ${colors.text}`}>{count}</div>
      <div className={STATISTICS_CARD.label}>{label}</div>
    </div>
  )
}
