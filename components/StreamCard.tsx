'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Stream } from '@/lib/types'

interface StreamCardProps {
  stream: Stream
}

export function StreamCard({ stream }: StreamCardProps) {
  return (
    <Link href={`/stream/${stream.id}`}>
      <div className="group cursor-pointer rounded-lg overflow-hidden bg-card hover:bg-card/80 transition-colors">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          <Image
            src={stream.thumbnail}
            alt={stream.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {stream.isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 px-2 py-1 rounded text-xs font-semibold text-white">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          )}
          <div className="absolute bottom-2 right-2 text-xs font-semibold text-white bg-black/60 px-2 py-1 rounded">
            {stream.duration}
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-foreground group-hover:text-accent transition-colors">
            {stream.title}
          </h3>

          {/* Streamer info */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0 relative overflow-hidden">
              <Image
                src={stream.streamer.avatar}
                alt={stream.streamer.username}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {stream.streamer.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {stream.viewers.toLocaleString()} viewers
              </p>
            </div>
          </div>

          {/* Category and tags */}
          <div className="flex items-center gap-1 flex-wrap mb-2">
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
              {stream.category}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
