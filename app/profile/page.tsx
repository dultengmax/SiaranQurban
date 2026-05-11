'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { StreamCard } from '@/components/StreamCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Edit2, Heart, LogOut, Shield, Users, Video } from 'lucide-react'
import { mockStreamers, mockStreams } from '@/lib/mock-data'

export default function ProfilePage() {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [copiedStreamKey, setCopiedStreamKey] = useState(false)

  const currentUser = mockStreamers.user1
  const userStreams = mockStreams.filter(
    (stream) => stream.streamer.id === currentUser.id
  )
  const followedUsers = [mockStreamers.user2, mockStreamers.user3]
  const streamKey = 'rtmp://stream.streamstudio.tv:1935/live/user1'

  const handleCopyStreamKey = () => {
    navigator.clipboard.writeText(streamKey)
    setCopiedStreamKey(true)
    setTimeout(() => setCopiedStreamKey(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="mb-5 rounded-lg border border-border bg-card p-4 sm:mb-6 sm:p-6">
          <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:gap-6">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-4 border-accent/20 bg-muted sm:h-24 sm:w-24">
              <Image
                src={currentUser.avatar}
                alt={currentUser.username}
                fill
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {currentUser.username}
                </h1>
                <span className="rounded-full bg-accent/20 px-3 py-1 text-sm text-accent">
                  Verified
                </span>
              </div>

              <p className="mb-4 text-sm text-muted-foreground sm:text-base">
                {currentUser.bio || 'No bio set'}
              </p>

              <div className="mb-4 flex flex-wrap gap-6 text-sm">
                <div>
                  <div className="font-semibold text-foreground">
                    {currentUser.followers.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">Followers</div>
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {userStreams.length}
                  </div>
                  <div className="text-muted-foreground">Streams</div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  variant="outline"
                  className="w-full gap-2 sm:w-auto"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Link href="/studio" className="w-full sm:w-auto">
                  <Button className="w-full gap-2 sm:w-auto">
                    <Video className="h-4 w-4" />
                    Start Streaming
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {isEditingProfile && (
          <div className="mb-5 space-y-4 rounded-lg border border-border bg-card p-4 sm:mb-6 sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Edit2 className="h-5 w-5 text-accent" />
              Edit Profile
            </h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Username
              </label>
              <Input
                defaultValue={currentUser.username}
                className="bg-secondary text-foreground"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Bio
              </label>
              <Textarea
                defaultValue={currentUser.bio}
                placeholder="Tell viewers about yourself..."
                className="resize-none bg-secondary text-foreground"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="w-full sm:w-auto">Save Changes</Button>
              <Button
                variant="outline"
                onClick={() => setIsEditingProfile(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="streams" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 sm:max-w-md">
            <TabsTrigger
              value="streams"
              className="flex min-h-10 items-center gap-1 text-xs sm:text-sm"
            >
              <Video className="h-4 w-4" />
              Streams
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="flex min-h-10 items-center gap-1 text-xs sm:text-sm"
            >
              <Heart className="h-4 w-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex min-h-10 items-center gap-1 text-xs sm:text-sm"
            >
              <Users className="h-4 w-4" />
              Following
            </TabsTrigger>
          </TabsList>

          <TabsContent value="streams" className="mt-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                My Streams
              </h3>
              {userStreams.length === 0 ? (
                <div className="rounded-lg border border-border bg-card px-4 py-10 text-center sm:py-12">
                  <p className="mb-4 text-muted-foreground">
                    You haven&apos;t created any streams yet
                  </p>
                  <Link href="/studio">
                    <Button>Create Your First Stream</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {userStreams.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Favorite Streams
              </h3>
              <div className="rounded-lg border border-border bg-card px-4 py-10 text-center sm:py-12">
                <p className="text-muted-foreground">
                  No favorite streams yet. Like streams to add them here!
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="following" className="mt-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Following
              </h3>
              {followedUsers.length === 0 ? (
                <div className="rounded-lg border border-border bg-card px-4 py-10 text-center sm:py-12">
                  <p className="text-muted-foreground">
                    You&apos;re not following anyone yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center"
                    >
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                        <Image
                          src={user.avatar}
                          alt={user.username}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground">
                          {user.username}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {user.followers.toLocaleString()} followers
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        Unfollow
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-6 rounded-lg border border-border bg-card p-4 sm:mt-8 sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Shield className="h-5 w-5 text-accent" />
            Settings
          </h2>

          <div>
            <h3 className="mb-3 font-semibold text-foreground">Stream Key</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Use this key with your streaming software to broadcast
            </p>
            <div className="mb-2 flex flex-col gap-2 sm:flex-row">
              <Input
                type="password"
                value={streamKey}
                readOnly
                className="bg-secondary font-mono text-xs text-foreground"
              />
              <Button
                onClick={handleCopyStreamKey}
                variant={copiedStreamKey ? 'default' : 'outline'}
                className="w-full flex-shrink-0 sm:w-auto"
              >
                {copiedStreamKey ? 'Copied!' : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-red-500">
              Keep this key private. Never share it publicly.
            </p>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="mb-3 font-semibold text-foreground">Account</h3>
            <Button
              variant="outline"
              className="w-full gap-2 text-red-500 sm:w-auto"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
