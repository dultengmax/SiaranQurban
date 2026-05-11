'use client'

import { useState, useCallback, useRef } from 'react'
import type { PeerConnection, RTCMessage } from '@/lib/types'

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export function useWebRTC() {
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map())
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const peersRef = useRef(peers)
  const signalingRef = useRef<((message: RTCMessage) => void) | null>(null)

  // Set signaling callback
  const setSignalingHandler = useCallback((handler: (message: RTCMessage) => void) => {
    signalingRef.current = handler
  }, [])

  // Create peer connection
  const createPeerConnection = useCallback(
    (peerId: string, initiator: boolean = false) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
      })

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && signalingRef.current) {
          signalingRef.current({
            type: 'ice-candidate',
            from: peerId,
            to: peerId,
            data: { candidate: event.candidate },
          })
        }
      }

      peerConnection.ontrack = (event) => {
        console.log('[v0] Received remote track:', event.track.kind)
      }

      peerConnection.onconnectionstatechange = () => {
        console.log('[v0] Connection state:', peerConnection.connectionState)
      }

      const peer: PeerConnection = {
        peerId,
        connection: peerConnection,
        stream: localStream || undefined,
      }

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream)
        })
      }

      peersRef.current.set(peerId, peer)
      setPeers(new Map(peersRef.current))

      return peerConnection
    },
    [localStream]
  )

  // Create offer
  const createOffer = useCallback(async (peerId: string) => {
    const peerConnection = peersRef.current.get(peerId)?.connection
    if (!peerConnection) return

    try {
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      if (signalingRef.current) {
        signalingRef.current({
          type: 'offer',
          from: peerId,
          to: peerId,
          data: { sdp: offer },
        })
      }
    } catch (err) {
      console.error('[v0] Error creating offer:', err)
    }
  }, [])

  // Create answer
  const createAnswer = useCallback(async (peerId: string, offer: RTCSessionDescription) => {
    const peerConnection = peersRef.current.get(peerId)?.connection
    if (!peerConnection) return

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      if (signalingRef.current) {
        signalingRef.current({
          type: 'answer',
          from: peerId,
          to: peerId,
          data: { sdp: answer },
        })
      }
    } catch (err) {
      console.error('[v0] Error creating answer:', err)
    }
  }, [])

  // Handle remote answer
  const handleRemoteAnswer = useCallback(async (peerId: string, answer: RTCSessionDescription) => {
    const peerConnection = peersRef.current.get(peerId)?.connection
    if (!peerConnection) return

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (err) {
      console.error('[v0] Error handling answer:', err)
    }
  }, [])

  // Add ICE candidate
  const addIceCandidate = useCallback(async (peerId: string, candidate: RTCIceCandidate) => {
    const peerConnection = peersRef.current.get(peerId)?.connection
    if (!peerConnection) return

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.error('[v0] Error adding ICE candidate:', err)
    }
  }, [])

  // Close peer connection
  const closePeerConnection = useCallback((peerId: string) => {
    const peer = peersRef.current.get(peerId)
    if (peer) {
      peer.connection.close()
      peersRef.current.delete(peerId)
      setPeers(new Map(peersRef.current))
    }
  }, [])

  // Set local stream
  const setLocalMediaStream = useCallback((stream: MediaStream | null) => {
    setLocalStream(stream)
  }, [])

  return {
    peers,
    localStream,
    setLocalMediaStream,
    createPeerConnection,
    createOffer,
    createAnswer,
    handleRemoteAnswer,
    addIceCandidate,
    closePeerConnection,
    setSignalingHandler,
  }
}
