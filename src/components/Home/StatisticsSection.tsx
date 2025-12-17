import { CARD_STYLES, SPACING } from '@/styles/themes'
import { StatisticsCard } from './StatisticsCard'

interface StatisticsSectionProps {
  redCount?: number
  yellowCount?: number
  greenCount?: number
}

export function StatisticsSection({
  redCount = 0,
  yellowCount = 0,
  greenCount = 0,
}: StatisticsSectionProps) {
  return (
    <section className={CARD_STYLES.default}>
      <h3 className="text-xl font-semibold mb-3">快速統計</h3>
      <div className={`${SPACING.grid3} text-center`}>
        <StatisticsCard count={redCount} label="緊急" status="red" />
        <StatisticsCard count={yellowCount} label="注意" status="yellow" />
        <StatisticsCard count={greenCount} label="安全" status="green" />
      </div>
    </section>
  )
}
