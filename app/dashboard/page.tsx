import type { Metadata } from 'next'
import DashboardApp from '@/src/App'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export default function DashboardPage() {
  return <DashboardApp />
}
