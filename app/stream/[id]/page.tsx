'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { VideoPreview } from '@/components/VideoPreview'
import { ChatPanel } from '@/components/ChatPanel'
import { StreamCard } from '@/components/StreamCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Share2,
  Heart,
  Users,
  Eye,
  MessageSquare,
  Info,
  Clock,
  MapPin,
} from 'lucide-react'
import { mockStreams, mockChatMessages, mockStreamers } from '@/lib/mock-data'
import type { ChatMessage, Stream } from '@/lib/types'

export default function StreamViewerPage() {
  const params = useParams()
  const streamId = params.id as string

  // Find the stream
  const currentStream = mockStreams.find((s) => s.id === streamId)

  const [isLiked, setIsLiked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages)
  const [showInfo, setShowInfo] = useState(false)

  if (!currentStream) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Stream not found</h1>
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

  // Get recommended streams
  const recommendedStreams = mockStreams
    .filter((s) => s.id !== streamId && s.category === currentStream.category)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Stream Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {/* Placeholder for stream video - in real implementation would use WebRTC */}
                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                  <div className="text-center">
                    <Eye className="w-12 h-12 text-accent/40 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">
                      Stream would appear here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      WebRTC peer-to-peer streaming initialized
                    </p>
                  </div>
                </div>

                {/* Live Badge */}
                {currentStream.isLive && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full text-sm font-semibold text-white">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                )}

                {/* Viewers */}
                <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-black/40 px-3 py-1.5 rounded text-sm text-white">
                  <Eye className="w-4 h-4" />
                  {currentStream.viewers.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Stream Info Header */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      {currentStream.title}
                    </h1>
                    {currentStream.isLive && (
                      <Badge className="bg-red-600 hover:bg-red-700">LIVE</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {currentStream.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-shrink-0">
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
                      className="w-5 h-5"
                      fill={isLiked ? 'currentColor' : 'none'}
                    />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {currentStream.viewers.toLocaleString()} viewers
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {currentStream.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {currentStream.streamer.followers.toLocaleString()} followers
                </div>
              </div>
            </div>

            {/* Streamer Info Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                  <Image
                    src={currentStream.streamer.avatar}
                    alt={currentStream.streamer.username}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {currentStream.streamer.username}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {currentStream.streamer.bio}
                  </p>
                  <p className="text-sm text-accent">
                    {currentStream.streamer.followers.toLocaleString()} followers
                  </p>
                </div>

                {/* Follow Button */}
                <Button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`flex-shrink-0 ${
                    isFollowing ? 'bg-accent/20 text-accent hover:bg-accent/30' : ''
                  }`}
                  variant={isFollowing ? 'default' : 'default'}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
            </div>

            {/* Stream Details */}
            {showInfo && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Info className="w-5 h-5 text-accent" />
                  Stream Details
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Category</p>
                    <p className="font-medium text-foreground">
                      {currentStream.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Duration</p>
                    <p className="font-medium text-foreground">
                      {currentStream.duration}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground mb-2">Tags</p>
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

          {/* Chat and Recommendations Sidebar */}
          <div className="space-y-6">
            {/* Chat */}
            <ChatPanel
              messages={chatMessages}
              onSendMessage={handleSendMessage}
            />

            {/* Recommended Streams */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Compass className="w-5 h-5 text-accent" />
                Recommended
              </h3>
              {recommendedStreams.map((stream) => (
                <StreamCard key={stream.id} stream={stream} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Import Compass for recommendations section
import { Compass } from 'lucide-react'
