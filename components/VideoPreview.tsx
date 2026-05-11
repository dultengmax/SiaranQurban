'use client'

import { useEffect, useRef } from 'react'

interface VideoPreviewProps {
  stream: MediaStream | null
  muted?: boolean
  className?: string
  mirrored?: boolean
  placeHolder?: string
}

export function VideoPreview({
  stream,
  muted = true,
  className = '',
  mirrored = true,
  placeHolder,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (!stream && placeHolder) {
    return (
      <div
        className={`w-full h-full bg-muted flex items-center justify-center ${className}`}
      >
        <span className="text-muted-foreground text-sm">{placeHolder}</span>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={muted}
      playsInline
      className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''} ${className}`}
    />
  )
}
