'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { ChatPanel } from '@/components/ChatPanel'
import { StreamCard } from '@/components/StreamCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Compass,
  Heart,
  Info,
  Clock,
  Eye,
  Share2,
  Users,
} from 'lucide-react'
import { mockChatMessages, mockStreams } from '@/lib/mock-data'
import type { ChatMessage } from '@/lib/types'

export default function StreamViewerPage() {
  const params = useParams()
  const streamId = params.id as string
  const currentStream = mockStreams.find((stream) => stream.id === streamId)

  const [isLiked, setIsLiked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>(mockChatMessages)
  const [showInfo, setShowInfo] = useState(false)

  if (!currentStream) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
          <div className="py-12 text-center">
            <h1 className="mb-2 text-2xl font-bold">Stream not found</h1>
            <p className="text-muted-foreground">
              The stream you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      author: 'You',
      authorId: 'current-user',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
      content: message,
      timestamp: new Date(),
      color: 'hsl(270 100% 55%)',
    }

    setChatMessages((prev) => [...prev, newMessage])
  }

  const recommendedStreams = mockStreams
    .filter(
      (stream) =>
        stream.id !== streamId && stream.category === currentStream.category
    )
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4 lg:col-span-1">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="relative aspect-video bg-muted">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
                  <div className="text-center">
                    <Eye className="mx-auto mb-2 h-10 w-10 text-accent/40 sm:h-12 sm:w-12" />
                    <p className="text-sm text-muted-foreground">
                      Stream would appear here
                    </p>
                    <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                      WebRTC peer-to-peer streaming initialized
                    </p>
                  </div>
                </div>

                {currentStream.isLive && (
                  <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white sm:left-4 sm:top-4 sm:text-sm">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    LIVE
                  </div>
                )}

                <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded bg-black/40 px-3 py-1.5 text-xs text-white sm:bottom-4 sm:left-4 sm:text-sm">
                  <Eye className="h-4 w-4" />
                  {currentStream.viewers.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                      {currentStream.title}
                    </h1>
                    {currentStream.isLive && (
                      <Badge className="bg-red-600 hover:bg-red-700">
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground sm:text-base">
                    {currentStream.description}
                  </p>
                </div>

                <div className="flex w-full flex-shrink-0 gap-2 sm:w-auto">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsLiked(!isLiked)}
                    className={
                      isLiked
                        ? 'text-red-500 border-red-500'
                        : 'text-foreground'
                    }
                  >
                    <Heart
                      className="h-5 w-5"
                      fill={isLiked ? 'currentColor' : 'none'}
                    />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {currentStream.viewers.toLocaleString()} viewers
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {currentStream.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {currentStream.streamer.followers.toLocaleString()} followers
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                  <Image
                    src={currentStream.streamer.avatar}
                    alt={currentStream.streamer.username}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {currentStream.streamer.username}
                  </h3>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {currentStream.streamer.bio}
                  </p>
                  <p className="text-sm text-accent">
                    {currentStream.streamer.followers.toLocaleString()}{' '}
                    followers
                  </p>
                </div>

                <Button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`w-full flex-shrink-0 sm:w-auto ${
                    isFollowing
                      ? 'bg-accent/20 text-accent hover:bg-accent/30'
                      : ''
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
            </div>

            {showInfo && (
              <div className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Info className="h-5 w-5 text-accent" />
                  Stream Details
                </h3>

                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-muted-foreground">Category</p>
                    <p className="font-medium text-foreground">
                      {currentStream.category}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Duration</p>
                    <p className="font-medium text-foreground">
                      {currentStream.duration}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {currentStream.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowInfo(!showInfo)}
            >
              {showInfo ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto lg:pr-1">
            <div className="lg:h-[520px]">
              <ChatPanel
                messages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <Compass className="h-5 w-5 text-accent" />
                Recommended
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {recommendedStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
