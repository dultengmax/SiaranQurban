'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { io } from 'socket.io-client'
import { Header } from '@/components/Header'
import { LiveChatMonitor } from '@/components/LiveChatMonitor'
import { StreamCard } from '@/components/StreamCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Compass,
  Heart,
  Info,
  Clock,
  Eye,
  Loader2,
  Share2,
  Users,
  Wifi,
} from 'lucide-react'
import { mockStreams } from '@/lib/mock-data'

const API_URL = 'https://dbmhq.site'
const LIVE_VIEWER_SESSION_ID = 'live_utama'
const TOKEN_STORAGE_KEYS = ['adminAccessToken', 'accessToken', 'token']

type ViewerSocketStatus =
  | 'idle'
  | 'missing-token'
  | 'connecting'
  | 'connected'
  | 'error'

interface ActiveViewer {
  id: string
  name: string
  meta?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readStringField(
  source: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  return undefined
}

function normalizeViewer(viewer: unknown, index: number): ActiveViewer {
  if (typeof viewer === 'string' || typeof viewer === 'number') {
    const value = String(viewer)

    return {
      id: value,
      name: value,
    }
  }

  if (!isRecord(viewer)) {
    return {
      id: `viewer-${index}`,
      name: `User ${index + 1}`,
    }
  }

  const id =
    readStringField(viewer, ['id', '_id', 'userId', 'user_id', 'uid']) ??
    `viewer-${index}`
  const name =
    readStringField(viewer, [
      'name',
      'username',
      'displayName',
      'fullName',
      'email',
    ]) ?? `User ${index + 1}`
  const meta =
    readStringField(viewer, ['email', 'phone', 'role']) ??
    (id !== name ? id : undefined)

  return {
    id,
    name,
    meta,
  }
}

function normalizeViewerPayload(data: unknown) {
  if (!isRecord(data)) {
    return {
      total: 0,
      viewers: [] as ActiveViewer[],
    }
  }

  const viewers = Array.isArray(data.viewers)
    ? data.viewers.map(normalizeViewer)
    : []
  const total = Number(data.total)

  return {
    total: Number.isFinite(total) ? total : viewers.length,
    viewers,
  }
}

function getViewersSignature(total: number, viewers: ActiveViewer[]) {
  return `${total}|${viewers.map((viewer) => `${viewer.id}:${viewer.name}`).join('|')}`
}

function getStoredAdminAccessToken() {
  if (process.env.NEXT_PUBLIC_ADMIN_ACCESS_TOKEN) {
    return process.env.NEXT_PUBLIC_ADMIN_ACCESS_TOKEN
  }

  for (const key of TOKEN_STORAGE_KEYS) {
    const token = window.localStorage.getItem(key)

    if (token) {
      return token
    }
  }

  return null
}

function getViewerInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function StreamViewerPage() {
  const params = useParams()
  const streamId = params.id as string
  const currentStream = mockStreams.find((stream) => stream.id === streamId)
  const viewerSignatureRef = useRef('')

  const [isLiked, setIsLiked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [viewerSocketStatus, setViewerSocketStatus] =
    useState<ViewerSocketStatus>('idle')
  const [viewerSocketError, setViewerSocketError] = useState<string | null>(
    null
  )
  const [activeViewerTotal, setActiveViewerTotal] = useState(0)
  const [activeViewers, setActiveViewers] = useState<ActiveViewer[]>([])
  const [viewerUpdatedAt, setViewerUpdatedAt] = useState<Date | null>(null)
  const recommendedStreams = useMemo(() => {
    if (!currentStream) {
      return []
    }

    return mockStreams
      .filter(
        (stream) =>
          stream.id !== streamId && stream.category === currentStream.category
      )
      .slice(0, 3)
  }, [currentStream, streamId])

  useEffect(() => {
    const adminAccessToken = getStoredAdminAccessToken()

    if (!adminAccessToken) {
      setViewerSocketStatus('missing-token')
      setViewerSocketError(
        'Token admin belum tersedia untuk membaca penonton login.'
      )
      return
    }

    setViewerSocketStatus('connecting')
    setViewerSocketError(null)

    const socket = io(API_URL, {
      auth: {
        token: adminAccessToken,
        monitorOnly: true,
      },
      reconnectionDelayMax: 10000,
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      setViewerSocketStatus('connected')
      setViewerSocketError(null)
      socket.emit('watch_logged_in_viewers', {
        sessionId: LIVE_VIEWER_SESSION_ID,
      })
    })

    socket.on('connect_error', (error) => {
      setViewerSocketStatus('error')
      setViewerSocketError(error.message || 'Gagal tersambung ke monitor.')
    })

    socket.on('disconnect', () => {
      setViewerSocketStatus('connecting')
    })

    socket.on('logged_in_viewers', (data: unknown) => {
      const payload = normalizeViewerPayload(data)
      const nextSignature = getViewersSignature(payload.total, payload.viewers)

      if (nextSignature !== viewerSignatureRef.current) {
        viewerSignatureRef.current = nextSignature
        setActiveViewerTotal(payload.total)
        setActiveViewers(payload.viewers)
        setViewerUpdatedAt(new Date())
      }

      setViewerSocketStatus('connected')
      setViewerSocketError(null)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

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
                <div className="flex items-center gap-1">
                  <Wifi className="h-4 w-4" />
                  {activeViewerTotal.toLocaleString()} login active
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
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-foreground">
                    <Users className="h-5 w-5 text-accent" />
                    Penonton Login
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Session {LIVE_VIEWER_SESSION_ID}
                  </p>
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    viewerSocketStatus === 'connected'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : viewerSocketStatus === 'error' ||
                          viewerSocketStatus === 'missing-token'
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {viewerSocketStatus === 'connecting' ||
                  viewerSocketStatus === 'idle' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : viewerSocketStatus === 'connected' ? (
                    <Wifi className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  {viewerSocketStatus === 'connected'
                    ? 'Online'
                    : viewerSocketStatus === 'missing-token'
                      ? 'Token'
                      : viewerSocketStatus === 'error'
                        ? 'Error'
                        : 'Connect'}
                </div>
              </div>

              <div className="mb-4 rounded-lg bg-secondary p-4">
                <div className="text-3xl font-bold text-foreground">
                  {activeViewerTotal.toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  user login sedang menonton
                </div>
                {viewerUpdatedAt && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Update {viewerUpdatedAt.toLocaleTimeString('id-ID')}
                  </div>
                )}
              </div>

              {viewerSocketError && (
                <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
                  {viewerSocketError}
                </div>
              )}

              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {activeViewers.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                    Belum ada user login yang terbaca.
                  </div>
                ) : (
                  activeViewers.map((viewer) => (
                    <div
                      key={viewer.id}
                      className="flex min-w-0 items-center gap-3 rounded-md bg-secondary/60 p-3"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                        {getViewerInitials(viewer.name) || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">
                          {viewer.name}
                        </div>
                        {viewer.meta && (
                          <div className="truncate text-xs text-muted-foreground">
                            {viewer.meta}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <LiveChatMonitor
              apiUrl={API_URL}
              sessionId={LIVE_VIEWER_SESSION_ID}
              limit={60}
              refreshMs={10000}
            />

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
