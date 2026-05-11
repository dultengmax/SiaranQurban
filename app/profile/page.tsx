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
import {
  Edit2,
  Copy,
  Shield,
  LogOut,
  Heart,
  Video,
  Users,
} from 'lucide-react'
import { mockStreamers, mockStreams } from '@/lib/mock-data'

export default function ProfilePage() {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [copiedStreamKey, setCopiedStreamKey] = useState(false)

  // Mock current user
  const currentUser = mockStreamers.user1

  // Mock user's streams
  const userStreams = mockStreams.filter(
    (s) => s.streamer.id === currentUser.id
  )

  // Mock followers
  const followedUsers = [mockStreamers.user2, mockStreamers.user3]

  // Mock stream key
  const streamKey = 'rtmp://stream.streamstudio.tv:1935/live/user1'

  const handleCopyStreamKey = () => {
    navigator.clipboard.writeText(streamKey)
    setCopiedStreamKey(true)
    setTimeout(() => setCopiedStreamKey(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative w-24 h-24 flex-shrink-0 rounded-full overflow-hidden bg-muted border-4 border-accent/20">
              <Image
                src={currentUser.avatar}
                alt={currentUser.username}
                fill
                className="object-cover"
              />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold text-foreground">
                  {currentUser.username}
                </h1>
                <span className="text-sm bg-accent/20 text-accent px-3 py-1 rounded-full">
                  Verified
                </span>
              </div>

              <p className="text-muted-foreground mb-4">
                {currentUser.bio || 'No bio set'}
              </p>

              <div className="flex flex-wrap gap-6 text-sm mb-4">
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

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  variant="outline"
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
                <Link href="/studio">
                  <Button className="gap-2">
                    <Video className="w-4 h-4" />
                    Start Streaming
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Section */}
        {isEditingProfile && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-accent" />
              Edit Profile
            </h2>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Username
              </label>
              <Input
                defaultValue={currentUser.username}
                className="bg-secondary text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Bio
              </label>
              <Textarea
                defaultValue={currentUser.bio}
                placeholder="Tell viewers about yourself..."
                className="bg-secondary text-foreground resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button>Save Changes</Button>
              <Button
                variant="outline"
                onClick={() => setIsEditingProfile(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="streams" className="w-full">
          <TabsList className="grid w-full max-w-xs grid-cols-3">
            <TabsTrigger value="streams" className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              Streams
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Following
            </TabsTrigger>
          </TabsList>

          {/* Streams Tab */}
          <TabsContent value="streams" className="mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                My Streams
              </h3>
              {userStreams.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    You haven&apos;t created any streams yet
                  </p>
                  <Link href="/studio">
                    <Button>Create Your First Stream</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userStreams.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Favorite Streams
              </h3>
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <p className="text-muted-foreground">
                  No favorite streams yet. Like streams to add them here!
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Following
              </h3>
              {followedUsers.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <p className="text-muted-foreground">
                    You&apos;re not following anyone yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
                    >
                      <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                        <Image
                          src={user.avatar}
                          alt={user.username}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {user.username}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {user.followers.toLocaleString()} followers
                        </p>
                      </div>

                      <Button variant="outline" size="sm">
                        Unfollow
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Settings Section */}
        <div className="mt-8 bg-card border border-border rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            Settings
          </h2>

          {/* Stream Key */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Stream Key</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Use this key with your streaming software to broadcast
            </p>
            <div className="flex gap-2 mb-2">
              <Input
                type="password"
                value={streamKey}
                readOnly
                className="font-mono text-xs bg-secondary text-foreground"
              />
              <Button
                onClick={handleCopyStreamKey}
                variant={copiedStreamKey ? 'default' : 'outline'}
                className="flex-shrink-0"
              >
                {copiedStreamKey ? 'Copied!' : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-red-500">
              Keep this key private. Never share it publicly.
            </p>
          </div>

          {/* Account Actions */}
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold mb-3 text-foreground">Account</h3>
            <Button variant="outline" className="gap-2 text-red-500">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
