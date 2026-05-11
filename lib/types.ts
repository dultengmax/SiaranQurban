// Stream types
export interface Stream {
  id: string
  title: string
  description: string
  thumbnail: string
  streamer: Streamer
  viewers: number
  duration: number
  category: string
  isLive: boolean
  tags: string[]
}

export interface Streamer {
  id: string
  username: string
  avatar: string
  followers: number
  isFollowing?: boolean
  bio?: string
}

export interface StreamSession {
  id: string
  streamId: string
  startTime: Date
  endTime?: Date
  peakViewers: number
  totalViewers: number
}

// WebRTC types
export interface RTCMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave'
  from: string
  to?: string
  data?: {
    sdp?: RTCSessionDescription
    candidate?: RTCIceCandidate
  }
}

export interface PeerConnection {
  peerId: string
  connection: RTCPeerConnection
  dataChannel?: RTCDataChannel
  stream?: MediaStream
}

// Chat types
export interface ChatMessage {
  id: string
  author: string
  authorId: string
  avatar: string
  content: string
  timestamp: Date
  color?: string
}

// UI types
export interface ControlBarConfig {
  canStartStream: boolean
  isStreaming: boolean
  isMuted: boolean
  isVideoOn: boolean
  resolution: string
  bitrate: string
}
