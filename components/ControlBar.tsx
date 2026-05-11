'use client'

import { Button } from '@/components/ui/button'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  LogOut,
  Share2,
} from 'lucide-react'

interface ControlBarProps {
  isStreaming: boolean
  isMuted: boolean
  isVideoOn: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onStartStop: () => void
  onShare?: () => void
  onSettings?: () => void
  onExit?: () => void
}

export function ControlBar({
  isStreaming,
  isMuted,
  isVideoOn,
  onToggleAudio,
  onToggleVideo,
  onStartStop,
  onShare,
  onSettings,
  onExit,
}: ControlBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-b-lg border-t border-border bg-card p-3 sm:gap-3 sm:p-4">
      {/* Audio toggle */}
      <Button
        variant={isMuted ? 'destructive' : 'default'}
        size="icon"
        onClick={onToggleAudio}
        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        className="rounded-full"
      >
        {isMuted ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      {/* Video toggle */}
      <Button
        variant={!isVideoOn ? 'destructive' : 'default'}
        size="icon"
        onClick={onToggleVideo}
        title={!isVideoOn ? 'Turn on video' : 'Turn off video'}
        className="rounded-full"
      >
        {!isVideoOn ? (
          <VideoOff className="w-5 h-5" />
        ) : (
          <Video className="w-5 h-5" />
        )}
      </Button>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Start/Stop Stream */}
      <Button
        onClick={onStartStop}
        className={`min-w-[9.5rem] flex-1 rounded-full px-5 font-semibold sm:flex-none sm:px-6 ${
          isStreaming
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-accent hover:bg-accent/90'
        }`}
      >
        {isStreaming ? 'Stop Stream' : 'Start Stream'}
      </Button>

      {/* Share */}
      {onShare && (
        <Button
          variant="outline"
          size="icon"
          onClick={onShare}
          title="Share stream"
          className="rounded-full"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      )}

      {/* Settings */}
      {onSettings && (
        <Button
          variant="outline"
          size="icon"
          onClick={onSettings}
          title="Settings"
          className="rounded-full"
        >
          <Settings className="w-5 h-5" />
        </Button>
      )}

      {/* Exit */}
      {onExit && (
        <Button
          variant="outline"
          size="icon"
          onClick={onExit}
          title="Exit"
          className="rounded-full"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
}
