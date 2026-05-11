'use client'

import { useState, useCallback, useEffect } from 'react'

export function useMediaStream() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getStream = useCallback(async (constraints: MediaStreamConstraints = { video: true, audio: true }) => {
    try {
      setIsLoading(true)
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      return mediaStream
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get media stream'
      setError(message)
      console.error('[v0] Media stream error:', message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  const toggleAudio = useCallback((enabled: boolean) => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = enabled
      })
    }
  }, [stream])

  const toggleVideo = useCallback((enabled: boolean) => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = enabled
      })
    }
  }, [stream])

  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [stopStream])

  return {
    stream,
    isLoading,
    error,
    getStream,
    stopStream,
    toggleAudio,
    toggleVideo,
  }
}
