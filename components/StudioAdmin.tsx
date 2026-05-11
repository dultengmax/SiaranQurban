'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clapperboard,
  Loader2,
  MonitorUp,
  Radio,
  Square,
  Video,
  Wifi,
} from 'lucide-react'

const MEDIA_SERVER_ORIGIN = 'https://live.ibrahimfarm.com'
const STREAM_PATH = 'live/hasil_opus'
const WHIP_ENDPOINT = `${MEDIA_SERVER_ORIGIN}/${STREAM_PATH}/whip`
const HLS_FALLBACK_URL = `${MEDIA_SERVER_ORIGIN}/${STREAM_PATH}/index.m3u8`
const PUBLIC_ICE_HOST = '187.77.114.161'
const WEBRTC_PORT = '8889'
const ICE_MUX_PORT = '8189'
const OUTPUT_WIDTH = 1080
const OUTPUT_HEIGHT = 1920
const OUTPUT_FPS = 30
const OUTPUT_RESOLUTION = `${OUTPUT_WIDTH} x ${OUTPUT_HEIGHT}`

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: OUTPUT_WIDTH },
    height: { ideal: OUTPUT_HEIGHT },
    aspectRatio: { ideal: OUTPUT_WIDTH / OUTPUT_HEIGHT },
  },
  audio: true,
}

function waitForIceGatheringComplete(pc: RTCPeerConnection) {
  if (pc.iceGatheringState === 'complete') {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', handleStateChange)
      resolve()
    }, 3000)

    function handleStateChange() {
      if (pc.iceGatheringState === 'complete') {
        window.clearTimeout(timeout)
        pc.removeEventListener('icegatheringstatechange', handleStateChange)
        resolve()
      }
    }

    pc.addEventListener('icegatheringstatechange', handleStateChange)
  })
}

export function StudioAdmin() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const sourceStreamRef = useRef<MediaStream | null>(null)
  const broadcastStreamRef = useRef<MediaStream | null>(null)
  const sourceVideoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const whipSessionRef = useRef<string | null>(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasPreview, setHasPreview] = useState(false)
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>('new')
  const [statusMessage, setStatusMessage] = useState(
    'Kamera siap dinyalakan'
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stopPortraitComposer = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (sourceVideoRef.current) {
      sourceVideoRef.current.pause()
      sourceVideoRef.current.srcObject = null
      sourceVideoRef.current = null
    }

    broadcastStreamRef.current
      ?.getVideoTracks()
      .forEach((track) => track.stop())
    broadcastStreamRef.current = null
    canvasRef.current = null
  }, [])

  const releaseLocalMedia = useCallback(
    (updatePreview = true) => {
      stopPortraitComposer()

      sourceStreamRef.current?.getTracks().forEach((track) => track.stop())
      sourceStreamRef.current = null

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      if (updatePreview) {
        setHasPreview(false)
      }
    },
    [stopPortraitComposer]
  )

  const createPortraitBroadcastStream = useCallback(
    async (sourceStream: MediaStream) => {
      stopPortraitComposer()

      const sourceVideo = document.createElement('video')
      sourceVideo.muted = true
      sourceVideo.autoplay = true
      sourceVideo.playsInline = true
      sourceVideo.srcObject = sourceStream
      sourceVideoRef.current = sourceVideo

      await new Promise<void>((resolve, reject) => {
        if (sourceVideo.readyState >= HTMLMediaElement.HAVE_METADATA) {
          resolve()
          return
        }

        const cleanup = () => {
          sourceVideo.removeEventListener('loadedmetadata', handleLoaded)
          sourceVideo.removeEventListener('error', handleError)
        }

        const handleLoaded = () => {
          cleanup()
          resolve()
        }

        const handleError = () => {
          cleanup()
          reject(new Error('Gagal membaca metadata kamera.'))
        }

        sourceVideo.addEventListener('loadedmetadata', handleLoaded)
        sourceVideo.addEventListener('error', handleError)
      })

      await sourceVideo.play()

      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_WIDTH
      canvas.height = OUTPUT_HEIGHT
      canvasRef.current = canvas

      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Canvas portrait tidak tersedia.')
      }

      const drawFrame = () => {
        const sourceWidth = sourceVideo.videoWidth || OUTPUT_WIDTH
        const sourceHeight = sourceVideo.videoHeight || OUTPUT_HEIGHT
        const sourceRatio = sourceWidth / sourceHeight
        const outputRatio = OUTPUT_WIDTH / OUTPUT_HEIGHT

        let cropX = 0
        let cropY = 0
        let cropWidth = sourceWidth
        let cropHeight = sourceHeight

        if (sourceRatio > outputRatio) {
          cropWidth = sourceHeight * outputRatio
          cropX = (sourceWidth - cropWidth) / 2
        } else {
          cropHeight = sourceWidth / outputRatio
          cropY = (sourceHeight - cropHeight) / 2
        }

        context.drawImage(
          sourceVideo,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          OUTPUT_WIDTH,
          OUTPUT_HEIGHT
        )

        animationFrameRef.current = window.requestAnimationFrame(drawFrame)
      }

      drawFrame()

      const broadcastStream = canvas.captureStream(OUTPUT_FPS)
      sourceStream
        .getAudioTracks()
        .forEach((track) => broadcastStream.addTrack(track))
      broadcastStreamRef.current = broadcastStream

      return broadcastStream
    },
    [stopPortraitComposer]
  )

  const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onconnectionstatechange = null
      pcRef.current.oniceconnectionstatechange = null
      pcRef.current.close()
      pcRef.current = null
    }
  }, [])

  const stopStreaming = useCallback(async () => {
    const whipSession = whipSessionRef.current

    setIsConnecting(false)
    setIsStreaming(false)
    setConnectionState('closed')
    setStatusMessage('Siaran dihentikan')

    whipSessionRef.current = null
    closePeerConnection()
    releaseLocalMedia()

    if (whipSession) {
      await fetch(whipSession, { method: 'DELETE' }).catch(() => {
        // MediaMTX will still drop the publishing session when the peer closes.
      })
    }
  }, [closePeerConnection, releaseLocalMedia])

  const startStreaming = useCallback(async () => {
    if (isConnecting || isStreaming) {
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Browser ini tidak mendukung akses kamera.')
      return
    }

    setIsConnecting(true)
    setErrorMessage(null)
    setStatusMessage('Meminta izin kamera dan mikrofon')

    try {
      releaseLocalMedia()
      closePeerConnection()

      const stream = await navigator.mediaDevices.getUserMedia(
        CAMERA_CONSTRAINTS
      )

      sourceStreamRef.current = stream

      setStatusMessage('Membentuk output portrait 1080x1920')

      const broadcastStream = await createPortraitBroadcastStream(stream)

      if (videoRef.current) {
        videoRef.current.srcObject = broadcastStream
      }

      setHasPreview(true)
      setStatusMessage('Membuka koneksi WebRTC')

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      pcRef.current = pc

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState)

        if (pc.connectionState === 'connected') {
          setStatusMessage(`Siaran aktif ke ${STREAM_PATH}`)
        }

        if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'disconnected'
        ) {
          setErrorMessage('Koneksi WebRTC terputus dari server.')
        }
      }

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'checking') {
          setStatusMessage('Menstabilkan jalur siaran')
        }
      }

      broadcastStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, broadcastStream))

      setStatusMessage('Mengirim negosiasi ke MediaMTX')

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await waitForIceGatheringComplete(pc)

      const response = await fetch(WHIP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: pc.localDescription?.sdp ?? offer.sdp,
      })

      if (!response.ok) {
        const reason = await response.text().catch(() => '')
        throw new Error(
          reason || `Gagal terhubung ke server (${response.status})`
        )
      }

      const sessionLocation = response.headers.get('location')
      if (sessionLocation) {
        whipSessionRef.current = new URL(
          sessionLocation,
          WHIP_ENDPOINT
        ).toString()
      }

      const answerSdp = await response.text()
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: answerSdp })
      )

      setIsStreaming(true)
      setStatusMessage(`Siaran aktif ke ${STREAM_PATH}`)
    } catch (error) {
      console.error('Error streaming:', error)
      setErrorMessage(
        'Gagal live. Pastikan izin kamera diberikan dan web memakai HTTPS.'
      )
      setStatusMessage('Siaran belum tersambung')
      closePeerConnection()
      releaseLocalMedia()
      window.alert(
        'Gagal live. Pastikan izin kamera diberikan dan web memakai HTTPS.'
      )
    } finally {
      setIsConnecting(false)
    }
  }, [
    closePeerConnection,
    createPortraitBroadcastStream,
    isConnecting,
    isStreaming,
    releaseLocalMedia,
  ])

  useEffect(() => {
    return () => {
      closePeerConnection()
      releaseLocalMedia(false)
    }
  }, [closePeerConnection, releaseLocalMedia])

  const buttonLabel = isStreaming
    ? 'Hentikan Siaran'
    : isConnecting
      ? 'Menghubungkan'
      : 'Mulai Siaran Langsung'

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase text-red-200">
              <Radio className="h-3.5 w-3.5" />
              Live Studio
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Studio Penyiaran
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400">
              Output portrait 1080x1920 via WebRTC WHIP ke path {STREAM_PATH}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-neutral-500">Resolusi</div>
              <div className="mt-1 font-semibold text-white">
                {OUTPUT_RESOLUTION}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-neutral-500">Rasio</div>
              <div className="mt-1 font-semibold text-white">9:16</div>
            </div>
            <div className="col-span-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 sm:col-span-1">
              <div className="text-neutral-500">WebRTC</div>
              <div className="mt-1 truncate font-semibold text-white">
                :{WEBRTC_PORT} / ICE :{ICE_MUX_PORT}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,480px)_minmax(280px,1fr)] lg:items-start lg:justify-center">
          <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/40">
            <div className="relative aspect-[9/16] bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              {!hasPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#050505_0%,#171717_48%,#090909_100%)]">
                  <div className="flex flex-col items-center gap-3 text-neutral-400">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                      <Video className="h-7 w-7" />
                    </div>
                    <span className="text-sm">Preview kamera belum aktif</span>
                  </div>
                </div>
              )}

              <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                {isStreaming && (
                  <div className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1 text-xs font-bold uppercase text-white shadow-lg shadow-red-950/50">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    Live
                  </div>
                )}
                {isConnecting && (
                  <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyambungkan
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/65 px-4 py-3 backdrop-blur">
                <div className="min-w-0">
                  <div className="text-xs uppercase text-neutral-500">
                    Status
                  </div>
                  <p className="truncate text-sm font-medium text-white">
                    {statusMessage}
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-2 text-xs text-neutral-300 sm:flex">
                  <Wifi className="h-4 w-4 text-emerald-400" />
                  {connectionState}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-neutral-800 bg-neutral-900 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-200">
                  <MonitorUp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Studio Penyiaran
                  </h2>
                  <p className="text-sm text-neutral-400">
                    Resolusi Output: 1080x1920
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={isStreaming ? stopStreaming : startStreaming}
                disabled={isConnecting}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-70 ${
                  isStreaming
                    ? 'bg-neutral-700 text-white hover:bg-neutral-600'
                    : 'bg-red-600 text-white shadow-[0_0_24px_rgba(220,38,38,0.35)] hover:bg-red-500'
                }`}
              >
                {isStreaming ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Radio className="h-4 w-4" />
                )}
                {buttonLabel}
              </button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Jalur MediaMTX
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-500">Path</dt>
                  <dd className="font-medium text-neutral-100">
                    {STREAM_PATH}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-500">Protokol</dt>
                  <dd className="font-medium text-neutral-100">
                    WHIP / WebRTC
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-500">Origin</dt>
                  <dd className="truncate font-medium text-neutral-100">
                    {MEDIA_SERVER_ORIGIN}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-500">Video</dt>
                  <dd className="font-medium text-neutral-100">
                    {OUTPUT_RESOLUTION}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-500">Frame</dt>
                  <dd className="font-medium text-neutral-100">Portrait 9:16</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <Clapperboard className="h-4 w-4 text-sky-400" />
                Endpoint VPS
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-500">ICE Host</dt>
                  <dd className="font-medium text-neutral-100">
                    {PUBLIC_ICE_HOST}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-500">WHIP</dt>
                  <dd className="truncate font-medium text-neutral-100">
                    {WHIP_ENDPOINT}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-500">HLS</dt>
                  <dd className="truncate font-medium text-neutral-100">
                    {HLS_FALLBACK_URL}
                  </dd>
                </div>
              </dl>
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Streaming gagal
                </div>
                <p className="text-red-100/80">{errorMessage}</p>
              </div>
            )}

            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
              <h3 className="text-sm font-semibold text-white">Telemetry</h3>
              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Sumber AV lokal
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  PeerConnection
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isStreaming ? 'bg-emerald-400' : 'bg-neutral-600'
                    }`}
                  />
                  Negosiasi SDP MediaMTX
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
