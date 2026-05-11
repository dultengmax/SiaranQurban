import type { Metadata } from 'next'
import { StudioAdmin } from '@/components/StudioAdmin'

export const metadata: Metadata = {
  title: 'Studio Penyiaran | StreamStudio',
  description: 'Halaman utama siaran langsung WebRTC WHIP untuk kamera utama.',
}

export default function HomePage() {
  return <StudioAdmin />
}
