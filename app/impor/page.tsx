import type { Metadata } from 'next'
import ImportLegacy from '@/src/components/ImportLegacy'

export const metadata: Metadata = {
  title: 'Impor data lama',
  robots: { index: false, follow: false },
}

export default function ImporPage() {
  return <ImportLegacy />
}
