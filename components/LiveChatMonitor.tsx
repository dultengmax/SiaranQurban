'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Clock,
  Copy,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Reply,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type LiveChatStatus = 'idle' | 'loading' | 'ready' | 'error'

interface LiveChatMonitorProps {
  apiUrl: string
  sessionId: string
  limit?: number
  refreshMs?: number
}

interface LiveChatMessage {
  id: string
  author: string
  content: string
  timeLabel: string
  timestamp?: Date
  meta?: string
}

interface LiveChatMessageItemProps {
  message: LiveChatMessage
  isSelected: boolean
  copiedId: string | null
  onCopy: (id: string, text: string) => void
  onReply: (message: LiveChatMessage) => void
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

function readNestedStringField(
  source: Record<string, unknown>,
  objectKeys: string[],
  fieldKeys: string[]
) {
  for (const key of objectKeys) {
    const nested = source[key]

    if (isRecord(nested)) {
      const value = readStringField(nested, fieldKeys)

      if (value) {
        return value
      }
    }
  }

  return undefined
}

function readDateField(source: Record<string, unknown>) {
  for (const key of ['createdAt', 'timestamp', 'sentAt', 'time', 'date']) {
    const value = source[key]

    if (typeof value !== 'string' && typeof value !== 'number') {
      continue
    }

    const numericValue = typeof value === 'number' ? value : Number(value)
    const date =
      Number.isFinite(numericValue) && numericValue > 0
        ? new Date(
            numericValue < 1000000000000
              ? numericValue * 1000
              : numericValue
          )
        : new Date(value)

    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  return undefined
}

function formatMessageTime(date?: Date) {
  if (!date) {
    return '--:--'
  }

  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function extractMessages(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (!isRecord(payload)) {
    return []
  }

  for (const key of ['messages', 'data', 'items', 'rows', 'results']) {
    const value = payload[key]

    if (Array.isArray(value)) {
      return value
    }

    if (isRecord(value) && Array.isArray(value.messages)) {
      return value.messages
    }
  }

  return []
}

function normalizeMessage(message: unknown, index: number): LiveChatMessage {
  if (typeof message === 'string' || typeof message === 'number') {
    const value = String(message)

    return {
      id: `message-${index}`,
      author: 'Viewer',
      content: value,
      timeLabel: '--:--',
    }
  }

  if (!isRecord(message)) {
    return {
      id: `message-${index}`,
      author: 'Viewer',
      content: 'Pesan tidak terbaca',
      timeLabel: '--:--',
    }
  }

  const timestamp = readDateField(message)
  const author =
    readStringField(message, [
      'author',
      'username',
      'name',
      'displayName',
      'senderName',
      'userName',
    ]) ??
    readNestedStringField(message, ['user', 'sender', 'viewer', 'account'], [
      'username',
      'name',
      'displayName',
      'email',
    ]) ??
    'Viewer'
  const content =
    readStringField(message, ['message', 'content', 'text', 'body']) ??
    'Pesan kosong'
  const id =
    readStringField(message, ['id', '_id', 'messageId', 'chatId']) ??
    `${author}-${timestamp?.getTime() ?? index}-${index}`
  const meta =
    readStringField(message, ['email', 'userId', 'senderId']) ??
    readNestedStringField(message, ['user', 'sender', 'viewer', 'account'], [
      'email',
      'id',
      '_id',
    ])

  return {
    id,
    author,
    content,
    timeLabel: formatMessageTime(timestamp),
    timestamp,
    meta,
  }
}

function getMessageInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function getMessagesSignature(messages: LiveChatMessage[]) {
  return messages
    .map((message) => {
      return `${message.id}:${message.timestamp?.getTime() ?? 0}:${message.content.length}`
    })
    .join('|')
}

const LiveChatMessageItem = memo(function LiveChatMessageItem({
  message,
  isSelected,
  copiedId,
  onCopy,
  onReply,
}: LiveChatMessageItemProps) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        isSelected ? 'border-accent bg-accent/10' : 'border-border bg-secondary/50'
      }`}
    >
      <div className="mb-2 flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
          {getMessageInitials(message.author) || 'V'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {message.author}
            </span>
            <span className="flex-shrink-0 text-xs text-muted-foreground">
              {message.timeLabel}
            </span>
          </div>
          {message.meta && (
            <div className="truncate text-xs text-muted-foreground">
              {message.meta}
            </div>
          )}
        </div>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
        {message.content}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onReply(message)}
          className="h-8 gap-1.5"
        >
          <Reply className="h-3.5 w-3.5" />
          Balas
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onCopy(message.id, `${message.author}: ${message.content}`)}
          className="h-8 gap-1.5 text-muted-foreground"
        >
          <Copy className="h-3.5 w-3.5" />
          {copiedId === message.id ? 'Disalin' : 'Salin'}
        </Button>
      </div>
    </div>
  )
})

export function LiveChatMonitor({
  apiUrl,
  sessionId,
  limit = 60,
  refreshMs = 10000,
}: LiveChatMonitorProps) {
  const abortControllerRef = useRef<AbortController | null>(null)
  const copyTimerRef = useRef<number | null>(null)
  const isFetchingRef = useRef(false)
  const isPageVisibleRef = useRef(true)
  const messagesSignatureRef = useRef('')

  const [status, setStatus] = useState<LiveChatStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const [replyTarget, setReplyTarget] = useState<LiveChatMessage | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, 250)

    return () => {
      window.clearTimeout(timer)
    }
  }, [query])

  const filteredMessages = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return messages
    }

    return messages.filter((message) => {
      return (
        message.author.toLowerCase().includes(normalizedQuery) ||
        message.content.toLowerCase().includes(normalizedQuery) ||
        message.meta?.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [debouncedQuery, messages])

  const loadMessages = useCallback(async () => {
    if (isFetchingRef.current) {
      return
    }

    isFetchingRef.current = true
    setStatus((current) => (current === 'ready' ? current : 'loading'))
    setErrorMessage(null)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const res = await fetch(
        `${apiUrl}/sessions/${sessionId}/messages?limit=${limit}`,
        {
          cache: 'no-store',
          signal: abortController.signal,
        }
      )

      if (!res.ok) {
        throw new Error('Gagal mengambil chat')
      }

      const payload = await res.json()
      const normalizedMessages = extractMessages(payload)
        .map(normalizeMessage)
        .sort((a, b) => {
          return (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
        })
      const nextSignature = getMessagesSignature(normalizedMessages)

      if (nextSignature !== messagesSignatureRef.current) {
        messagesSignatureRef.current = nextSignature
        setMessages(normalizedMessages)
      }

      setLastUpdatedAt(new Date())
      setStatus('ready')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      setStatus('error')
      setErrorMessage(
        error instanceof Error ? error.message : 'Gagal mengambil chat'
      )
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }

      isFetchingRef.current = false
    }
  }, [apiUrl, limit, sessionId])

  useEffect(() => {
    void loadMessages()

    const refreshTimer = window.setInterval(() => {
      if (isPageVisibleRef.current) {
        void loadMessages()
      }
    }, refreshMs)

    return () => {
      window.clearInterval(refreshTimer)
      abortControllerRef.current?.abort()
    }
  }, [loadMessages, refreshMs])

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = document.visibilityState === 'visible'

      if (isPageVisibleRef.current) {
        void loadMessages()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadMessages])

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const copyText = useCallback(async (id: string, text: string) => {
    await navigator.clipboard.writeText(text).catch(() => undefined)
    setCopiedId(id)

    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current)
    }

    copyTimerRef.current = window.setTimeout(() => {
      setCopiedId(null)
      copyTimerRef.current = null
    }, 1500)
  }, [])

  const prepareReply = useCallback((message: LiveChatMessage) => {
    setReplyTarget(message)
    setReplyDraft(`@${message.author} `)
  }, [])

  return (
    <div className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <MessageSquareText className="h-5 w-5 text-accent" />
              Live Chat
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {limit} pesan terakhir dari {sessionId}
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              status === 'ready'
                ? 'bg-emerald-500/15 text-emerald-400'
                : status === 'error'
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-secondary text-muted-foreground'
            }`}
          >
            {status === 'loading' || status === 'idle' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : status === 'error' ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {status === 'ready'
              ? 'Live'
              : status === 'error'
                ? 'Error'
                : 'Loading'}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau isi chat..."
              className="bg-secondary pl-9 text-foreground"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void loadMessages()}
            title="Refresh chat"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{filteredMessages.length.toLocaleString()} pesan tampil</span>
          <span>Refresh {Math.round(refreshMs / 1000)} detik</span>
          {lastUpdatedAt && (
            <span>Update {lastUpdatedAt.toLocaleTimeString('id-ID')}</span>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mx-4 mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
          {errorMessage}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {filteredMessages.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
            Belum ada chat yang terbaca.
          </div>
        ) : (
          filteredMessages.map((message) => (
            <LiveChatMessageItem
              key={message.id}
              message={message}
              isSelected={replyTarget?.id === message.id}
              copiedId={copiedId}
              onCopy={copyText}
              onReply={prepareReply}
            />
          ))
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="mb-2 text-xs font-medium text-muted-foreground">
          {replyTarget
            ? `Draft balasan ke ${replyTarget.author}`
            : 'Draft balasan admin'}
        </div>
        <Textarea
          value={replyDraft}
          onChange={(event) => setReplyDraft(event.target.value)}
          placeholder="Pilih Balas pada chat untuk membuat draft..."
          className="min-h-20 resize-none bg-secondary text-foreground"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!replyDraft.trim()}
          onClick={() => void copyText('reply-draft', replyDraft)}
          className="mt-2 w-full gap-1.5"
        >
          <Copy className="h-3.5 w-3.5" />
          {copiedId === 'reply-draft' ? 'Draft disalin' : 'Salin draft'}
        </Button>
      </div>
    </div>
  )
}
