import { SPACING } from '@/styles/themes'
import {
  WelcomeSection,
  StatisticsSection,
  ViewFullInventorySection,
} from '@/components'

export default function Home() {
  return (
    <div className={SPACING.section}>
      <WelcomeSection />
      <StatisticsSection />
      <ViewFullInventorySection />
    </div>
  )
}
