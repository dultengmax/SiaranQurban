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

const MEDIA_SERVER_ORIGIN =
  process.env.NEXT_PUBLIC_MEDIAMTX_WEBRTC_ORIGIN ??
  'https://live.ibrahimfarm.com'
const HLS_SERVER_ORIGIN =
  process.env.NEXT_PUBLIC_MEDIAMTX_HLS_ORIGIN ?? MEDIA_SERVER_ORIGIN
const STREAM_PATH = 'live/hasil_opus'
const WHIP_ENDPOINT = `${MEDIA_SERVER_ORIGIN}/${STREAM_PATH}/whip`
const PUBLISH_PAGE_URL = `${MEDIA_SERVER_ORIGIN}/${STREAM_PATH}/publish`
const HLS_FALLBACK_URL = `${HLS_SERVER_ORIGIN}/${STREAM_PATH}/index.m3u8`
const PUBLIC_ICE_HOST = '187.77.114.161'
const WEBRTC_PORT = '8889'
const ICE_MUX_PORT = '8189'
const TARGET_ASPECT_RATIO = 9 / 16
const DIRECT_STREAM_RATIO_TOLERANCE = 0.025

type BroadcastProfile = {
  label: string
  width: number
  height: number
  fps: number
  maxBitrate: number
}

type BroadcastOutput = {
  stream: MediaStream
  modeLabel: string
}

const DESKTOP_BROADCAST_PROFILE: BroadcastProfile = {
  label: 'Standar',
  width: 720,
  height: 1280,
  fps: 24,
  maxBitrate: 1_400_000,
}

const MOBILE_BROADCAST_PROFILE: BroadcastProfile = {
  label: 'Hemat HP',
  width: 540,
  height: 960,
  fps: 20,
  maxBitrate: 750_000,
}

const DEFAULT_BROADCAST_PROFILE = DESKTOP_BROADCAST_PROFILE

function getOutputResolution(profile: BroadcastProfile) {
  return `${profile.width} x ${profile.height}`
}

function isMobileOrLowPowerDevice() {
  const userAgentData = (
    navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  ).userAgentData

  if (userAgentData?.mobile) {
    return true
  }

  const narrowTouchDevice =
    window.matchMedia('(max-width: 820px)').matches &&
    navigator.maxTouchPoints > 0
  const lowCoreDevice = (navigator.hardwareConcurrency ?? 8) <= 4

  return narrowTouchDevice || lowCoreDevice
}

function getBroadcastProfile() {
  return isMobileOrLowPowerDevice()
    ? MOBILE_BROADCAST_PROFILE
    : DESKTOP_BROADCAST_PROFILE
}

function getCameraConstraints(profile: BroadcastProfile): MediaStreamConstraints {
  return {
    video: {
      width: { ideal: profile.width },
      height: { ideal: profile.height },
      aspectRatio: { ideal: TARGET_ASPECT_RATIO },
      frameRate: { ideal: profile.fps },
      facingMode: { ideal: 'environment' },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  }
}

function canUseSourceStreamDirectly(
  sourceVideo: HTMLVideoElement,
  profile: BroadcastProfile
) {
  const sourceWidth = sourceVideo.videoWidth
  const sourceHeight = sourceVideo.videoHeight

  if (!sourceWidth || !sourceHeight) {
    return false
  }

  const sourceRatio = sourceWidth / sourceHeight
  const matchesPortraitRatio =
    Math.abs(sourceRatio - TARGET_ASPECT_RATIO) <=
    DIRECT_STREAM_RATIO_TOLERANCE
  const staysInsideProfile =
    sourceWidth <= profile.width * 1.08 &&
    sourceHeight <= profile.height * 1.08

  return sourceHeight > sourceWidth && matchesPortraitRatio && staysInsideProfile
}

function createDirectBroadcastStream(sourceStream: MediaStream) {
  const directStream = new MediaStream()

  sourceStream
    .getVideoTracks()
    .forEach((track) => directStream.addTrack(track))
  sourceStream
    .getAudioTracks()
    .forEach((track) => directStream.addTrack(track))

  return directStream
}

async function applyVideoSenderLimits(
  sender: RTCRtpSender,
  profile: BroadcastProfile
) {
  const parameters = sender.getParameters()
  const [firstEncoding = {}] = parameters.encodings ?? []

  parameters.encodings = [
    {
      ...firstEncoding,
      maxBitrate: profile.maxBitrate,
      maxFramerate: profile.fps,
    },
  ]

  try {
    await sender.setParameters(parameters)
  } catch {
    // Some mobile browsers accept the stream but reject sender parameters.
  }
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

function getStreamingErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Izin kamera atau mikrofon ditolak. Buka izin browser untuk kamera dan mikrofon, lalu mulai lagi.'
    }

    if (error.name === 'NotFoundError') {
      return 'Kamera atau mikrofon tidak ditemukan di perangkat ini.'
    }

    if (error.name === 'NotReadableError') {
      return 'Kamera atau mikrofon sedang dipakai aplikasi lain.'
    }
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return `Tidak bisa menghubungi WHIP endpoint ${WHIP_ENDPOINT}. Cek CORS/preflight OPTIONS, firewall ICE ${ICE_MUX_PORT}, dan log MediaMTX.`
  }

  if (error instanceof Error) {
    return `${error.message} Endpoint: ${WHIP_ENDPOINT}`
  }

  return `Streaming gagal. Endpoint: ${WHIP_ENDPOINT}`
}

export function StudioAdmin() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const sourceStreamRef = useRef<MediaStream | null>(null)
  const broadcastStreamRef = useRef<MediaStream | null>(null)
  const sourceVideoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawTimerRef = useRef<number | null>(null)
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
  const [broadcastProfile, setBroadcastProfile] = useState(
    DEFAULT_BROADCAST_PROFILE
  )
  const [outputMode, setOutputMode] = useState('Menunggu kamera')

  useEffect(() => {
    setBroadcastProfile(getBroadcastProfile())
  }, [])

  const stopPortraitComposer = useCallback(() => {
    if (drawTimerRef.current !== null) {
      window.clearTimeout(drawTimerRef.current)
      drawTimerRef.current = null
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
        setOutputMode('Menunggu kamera')
      }
    },
    [stopPortraitComposer]
  )

  const createPortraitBroadcastStream = useCallback(
    async (
      sourceStream: MediaStream,
      profile: BroadcastProfile
    ): Promise<BroadcastOutput> => {
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

      if (canUseSourceStreamDirectly(sourceVideo, profile)) {
        const directStream = createDirectBroadcastStream(sourceStream)
        broadcastStreamRef.current = directStream
        sourceVideo.pause()
        sourceVideo.srcObject = null
        sourceVideoRef.current = null

        return {
          stream: directStream,
          modeLabel: 'kamera langsung',
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = profile.width
      canvas.height = profile.height
      canvasRef.current = canvas

      const context = canvas.getContext('2d', { alpha: false })

      if (!context) {
        throw new Error('Canvas portrait tidak tersedia.')
      }

      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'low'

      const frameInterval = 1000 / profile.fps

      const drawFrame = () => {
        if (sourceVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          drawTimerRef.current = window.setTimeout(drawFrame, frameInterval)
          return
        }

        const sourceWidth = sourceVideo.videoWidth || profile.width
        const sourceHeight = sourceVideo.videoHeight || profile.height
        const sourceRatio = sourceWidth / sourceHeight

        let cropX = 0
        let cropY = 0
        let cropWidth = sourceWidth
        let cropHeight = sourceHeight

        if (sourceRatio > TARGET_ASPECT_RATIO) {
          cropWidth = sourceHeight * TARGET_ASPECT_RATIO
          cropX = (sourceWidth - cropWidth) / 2
        } else {
          cropHeight = sourceWidth / TARGET_ASPECT_RATIO
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
          profile.width,
          profile.height
        )

        drawTimerRef.current = window.setTimeout(drawFrame, frameInterval)
      }

      drawFrame()

      const broadcastStream = canvas.captureStream(profile.fps)
      sourceStream
        .getAudioTracks()
        .forEach((track) => broadcastStream.addTrack(track))
      broadcastStreamRef.current = broadcastStream

      return {
        stream: broadcastStream,
        modeLabel: 'canvas ringan',
      }
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
    setOutputMode('Menunggu kamera')

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

    if (!window.isSecureContext) {
      setErrorMessage(
        'Halaman harus dibuka lewat HTTPS atau localhost agar kamera dan mikrofon bisa dipakai.'
      )
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Browser ini tidak mendukung akses kamera.')
      return
    }

    const profile = getBroadcastProfile()

    setIsConnecting(true)
    setBroadcastProfile(profile)
    setOutputMode('Menunggu kamera')
    setErrorMessage(null)
    setStatusMessage(
      `Meminta izin kamera (${getOutputResolution(profile)} @ ${profile.fps}fps)`
    )

    try {
      releaseLocalMedia()
      closePeerConnection()

      const stream = await navigator.mediaDevices.getUserMedia(
        getCameraConstraints(profile)
      )

      await Promise.all(
        stream.getVideoTracks().map((track) => {
          track.contentHint = 'motion'

          return track
            .applyConstraints({ frameRate: { max: profile.fps } })
            .catch(() => {
              // Browser may already choose the nearest supported camera mode.
            })
        })
      )

      sourceStreamRef.current = stream

      setStatusMessage(
        `Menyiapkan output ${getOutputResolution(profile)} @ ${profile.fps}fps`
      )

      const broadcastOutput = await createPortraitBroadcastStream(
        stream,
        profile
      )
      const broadcastStream = broadcastOutput.stream
      setOutputMode(broadcastOutput.modeLabel)

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
          setStatusMessage(`Siaran aktif ke ${STREAM_PATH} (${profile.label})`)
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

      const senderLimitTasks = broadcastStream.getTracks().map((track) => {
        const sender = pc.addTrack(track, broadcastStream)

        if (track.kind === 'video') {
          return applyVideoSenderLimits(sender, profile)
        }

        return Promise.resolve()
      })

      await Promise.all(senderLimitTasks)

      setStatusMessage('Mengirim negosiasi ke MediaMTX')

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await waitForIceGatheringComplete(pc)

      const response = await fetch(WHIP_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/sdp',
          'Content-Type': 'application/sdp',
        },
        body: pc.localDescription?.sdp ?? offer.sdp,
      })

      if (!response.ok) {
        const reason = await response.text().catch(() => '')
        throw new Error(
          reason ||
            `MediaMTX menolak koneksi WHIP (${response.status} ${response.statusText})`
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
      setStatusMessage(`Siaran aktif ke ${STREAM_PATH} (${profile.label})`)
    } catch (error) {
      const message = getStreamingErrorMessage(error)

      console.error('Error streaming:', error)
      setErrorMessage(message)
      setStatusMessage('Siaran belum tersambung')
      closePeerConnection()
      releaseLocalMedia()
      window.alert(message)
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
  const outputResolution = getOutputResolution(broadcastProfile)

  return (
    <main className="min-h-svh overflow-x-hidden bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:justify-center">
        <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4 sm:mb-6 sm:gap-4 sm:pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase text-red-200">
              <Radio className="h-3.5 w-3.5" />
              Live Studio
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Studio Penyiaran
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-400 sm:text-sm">
              Output portrait adaptif via WebRTC WHIP ke path {STREAM_PATH}.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 text-xs text-neutral-300 sm:w-auto sm:grid-cols-3">
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-neutral-500">Resolusi</div>
              <div className="mt-1 truncate font-semibold text-white">
                {outputResolution}
              </div>
            </div>
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-neutral-500">Frame</div>
              <div className="mt-1 font-semibold text-white">
                {broadcastProfile.fps} fps
              </div>
            </div>
            <div className="col-span-2 min-w-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 sm:col-span-1">
              <div className="text-neutral-500">Mode</div>
              <div className="mt-1 truncate font-semibold text-white">
                {broadcastProfile.label}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,480px)_minmax(280px,1fr)] xl:items-start xl:justify-center">
          <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 sm:max-w-[430px] sm:shadow-2xl sm:shadow-black/40">
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

              <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4">
                {isStreaming && (
                  <div className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1 text-xs font-bold uppercase text-white sm:shadow-lg sm:shadow-red-950/50">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    Live
                  </div>
                )}
                {isConnecting && (
                  <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-black/75 px-3 py-1 text-xs font-semibold text-white sm:bg-black/60 sm:backdrop-blur">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyambungkan
                  </div>
                )}
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/75 px-3 py-2.5 sm:bottom-4 sm:left-4 sm:right-4 sm:bg-black/65 sm:px-4 sm:py-3 sm:backdrop-blur">
                <div className="min-w-0">
                  <div className="text-xs uppercase text-neutral-500">
                    Status
                  </div>
                  <p className="line-clamp-2 text-sm font-medium leading-5 text-white sm:truncate">
                    {statusMessage}
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-2 text-xs text-neutral-300 sm:flex">
                  <Wifi className="h-4 w-4 text-emerald-400" />
                  {connectionState}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-neutral-800 bg-neutral-900 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-200">
                  <MonitorUp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Studio Penyiaran
                  </h2>
                  <p className="text-sm text-neutral-400">
                    Output: {outputResolution}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={isStreaming ? stopStreaming : startStreaming}
                disabled={isConnecting}
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-70 md:w-auto ${
                  isStreaming
                    ? 'bg-neutral-700 text-white hover:bg-neutral-600'
                    : 'bg-red-600 text-white hover:bg-red-500 sm:shadow-[0_0_24px_rgba(220,38,38,0.35)]'
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

          <aside className="space-y-3 sm:space-y-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Jalur MediaMTX
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-neutral-500">Path</dt>
                  <dd className="min-w-0 break-words text-right font-medium text-neutral-100">
                    {STREAM_PATH}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-neutral-500">Protokol</dt>
                  <dd className="min-w-0 text-right font-medium text-neutral-100">
                    WHIP / WebRTC
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-neutral-500">Origin</dt>
                  <dd className="min-w-0 break-all text-right font-medium text-neutral-100">
                    {MEDIA_SERVER_ORIGIN}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-neutral-500">Video</dt>
                  <dd className="min-w-0 text-right font-medium text-neutral-100">
                    {outputResolution}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-neutral-500">Frame</dt>
                  <dd className="min-w-0 text-right font-medium text-neutral-100">
                    {broadcastProfile.fps} fps / 9:16
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-neutral-500">Proses</dt>
                  <dd className="min-w-0 text-right font-medium text-neutral-100">
                    {outputMode}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <Clapperboard className="h-4 w-4 text-sky-400" />
                Endpoint VPS
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-neutral-500">ICE Host</dt>
                  <dd className="min-w-0 text-right font-medium text-neutral-100">
                    {PUBLIC_ICE_HOST}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-neutral-500">Port</dt>
                  <dd className="min-w-0 text-right font-medium text-neutral-100">
                    WebRTC {WEBRTC_PORT} / ICE {ICE_MUX_PORT}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-neutral-500">WHIP</dt>
                  <dd className="min-w-0 break-all text-right font-medium text-neutral-100">
                    {WHIP_ENDPOINT}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-neutral-500">Publish</dt>
                  <dd className="min-w-0 break-all text-right font-medium text-neutral-100">
                    {PUBLISH_PAGE_URL}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-neutral-500">HLS</dt>
                  <dd className="min-w-0 break-all text-right font-medium text-neutral-100">
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

            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
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
