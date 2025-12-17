import Link from 'next/link'
import { BUTTON_STYLES } from '@/styles/themes'

export function ViewFullInventorySection() {
  return (
    <section className="text-center">
      <Link
        href="/inventory"
        className={`inline-block ${BUTTON_STYLES.secondary} py-3 px-6 text-lg`}
      >
        查看完整庫存 →
      </Link>
    </section>
  )
}
