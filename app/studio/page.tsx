import type { Metadata } from 'next'
import { StudioAdmin } from '@/components/StudioAdmin'

export const metadata: Metadata = {
  title: 'Studio Penyiaran | StreamStudio',
  description:
    'Halaman siaran langsung WebRTC WHIP untuk kamera depan dan belakang.',
}

export default function StudioPage() {
  return <StudioAdmin />
}
