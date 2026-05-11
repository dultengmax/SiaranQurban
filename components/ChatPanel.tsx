'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import type { ChatMessage } from '@/lib/types'

interface ChatPanelProps {
  messages: ChatMessage[]
  onSendMessage?: (message: string) => void
  isReadOnly?: boolean
}

export function ChatPanel({
  messages,
  onSendMessage,
  isReadOnly = false,
}: ChatPanelProps) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message)
      setMessage('')
    }
  }

  return (
    <div className="flex h-full min-h-[360px] max-h-[70svh] flex-col overflow-hidden rounded-lg border border-border bg-card lg:max-h-none">
      <div className="border-b border-border px-3 py-3 sm:px-4">
        <h3 className="font-semibold text-foreground">Live Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-sm">
              <div className="flex items-start gap-2">
                <div
                  className="w-6 h-6 rounded-full bg-accent/20 flex-shrink-0 flex items-center justify-center text-xs font-semibold"
                  style={{
                    background: msg.color || 'hsl(var(--accent) / 0.2)',
                  }}
                >
                  {msg.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-semibold text-foreground truncate">
                      {msg.author}
                    </span>
                  </div>
                  <p className="text-muted-foreground break-words text-xs">
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isReadOnly && (
        <div className="flex gap-2 border-t border-border px-2.5 py-3 sm:px-3">
          <Input
            placeholder="Say something..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="text-sm bg-secondary text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={!message.trim()}
            className="flex-shrink-0 rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
