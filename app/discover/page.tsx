'use client'

import { useState, useMemo } from 'react'
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
import { Sliders } from 'lucide-react'
import { mockStreams } from '@/lib/mock-data'

type SortOption = 'trending' | 'viewers' | 'recent'

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('trending')

  const categories = ['all', 'Development', 'Gaming', 'Music', 'Art & Design', 'IRL', 'Esports']

  // Filter and sort streams
  const filteredStreams = useMemo(() => {
    let streams = mockStreams.filter((stream) => {
      const matchesSearch =
        stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.streamer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.tags.some((tag) => tag.includes(searchQuery.toLowerCase()))

      const matchesCategory =
        selectedCategory === 'all' || stream.category === selectedCategory

      return matchesSearch && matchesCategory
    })

    // Sort
    if (sortBy === 'viewers') {
      streams.sort((a, b) => b.viewers - a.viewers)
    } else if (sortBy === 'recent') {
      // Just reverse for demo
      streams = streams.reverse()
    } else {
      // trending - live first, then by viewers
      streams.sort((a, b) => {
        if (a.isLive !== b.isLive) {
          return a.isLive ? -1 : 1
        }
        return b.viewers - a.viewers
      })
    }

    return streams
  }, [searchQuery, selectedCategory, sortBy])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Discover Streams</h1>
          <p className="text-muted-foreground">
            Browse and find amazing streams from creators around the world
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-accent" />
            <h2 className="font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2 text-foreground">
                Search
              </label>
              <Input
                placeholder="Search streams, creators, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Sort By
              </label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
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

          {/* Active Filters */}
          {(searchQuery || selectedCategory !== 'all' || sortBy !== 'trending') && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchQuery && (
                <div className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <span>Search: {searchQuery}</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              )}
              {selectedCategory !== 'all' && (
                <div className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <span>Category: {selectedCategory}</span>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              )}
              {sortBy !== 'trending' && (
                <div className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <span>Sort: {sortBy}</span>
                  <button
                    onClick={() => setSortBy('trending')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setSortBy('trending')
                }}
                className="text-accent hover:text-accent/80"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredStreams.length} stream{filteredStreams.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filteredStreams.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                No streams found
              </p>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search query
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setSortBy('trending')
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
