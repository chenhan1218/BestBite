import Link from 'next/link'
import { BUTTON_STYLES } from '@/styles/themes'

export function BackToHomeLink() {
  return (
    <Link href="/" className={BUTTON_STYLES.link}>
      ← 返回首頁
    </Link>
  )
}
