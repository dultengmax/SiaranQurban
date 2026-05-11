'use client'

import { useMemo, useState } from 'react'
import { Header } from '@/components/Header'
import { StreamCard } from '@/components/StreamCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sliders, X } from 'lucide-react'
import { mockStreams } from '@/lib/mock-data'

type SortOption = 'trending' | 'viewers' | 'recent'

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('trending')

  const categories = [
    'all',
    'Development',
    'Gaming',
    'Music',
    'Art & Design',
    'IRL',
    'Esports',
  ]

  const filteredStreams = useMemo(() => {
    let streams = mockStreams.filter((stream) => {
      const normalizedSearch = searchQuery.toLowerCase()
      const matchesSearch =
        stream.title.toLowerCase().includes(normalizedSearch) ||
        stream.description.toLowerCase().includes(normalizedSearch) ||
        stream.streamer.username.toLowerCase().includes(normalizedSearch) ||
        stream.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))

      const matchesCategory =
        selectedCategory === 'all' || stream.category === selectedCategory

      return matchesSearch && matchesCategory
    })

    if (sortBy === 'viewers') {
      streams.sort((a, b) => b.viewers - a.viewers)
    } else if (sortBy === 'recent') {
      streams = streams.reverse()
    } else {
      streams.sort((a, b) => {
        if (a.isLive !== b.isLive) {
          return a.isLive ? -1 : 1
        }

        return b.viewers - a.viewers
      })
    }

    return streams
  }, [searchQuery, selectedCategory, sortBy])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSortBy('trending')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
            Discover Streams
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Browse and find amazing streams from creators around the world
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-border bg-card p-4 sm:mb-8 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-accent" />
            <h2 className="font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Search
              </label>
              <Input
                placeholder="Search streams, creators, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Sort By
              </label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="viewers">Most Viewers</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchQuery ||
            selectedCategory !== 'all' ||
            sortBy !== 'trending') && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchQuery && (
                <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm">
                  <span className="max-w-[14rem] truncate">
                    Search: {searchQuery}
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Clear search filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {selectedCategory !== 'all' && (
                <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm">
                  <span>Category: {selectedCategory}</span>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Clear category filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {sortBy !== 'trending' && (
                <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm">
                  <span>Sort: {sortBy}</span>
                  <button
                    onClick={() => setSortBy('trending')}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Clear sort filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-accent hover:text-accent/80"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredStreams.length} stream
              {filteredStreams.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filteredStreams.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center sm:p-12">
              <p className="mb-2 text-lg font-medium text-foreground">
                No streams found
              </p>
              <p className="mb-6 text-muted-foreground">
                Try adjusting your filters or search query
              </p>
              <Button onClick={clearFilters}>Reset Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStreams.map((stream) => (
                <StreamCard key={stream.id} stream={stream} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
