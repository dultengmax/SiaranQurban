'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, Lock, LogOut, Palette, Shield, Volume2 } from 'lucide-react'

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    liveNotifications: true,
    chatNotifications: true,
    emailUpdates: false,
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
        <h1 className="mb-5 text-2xl font-bold sm:mb-6 sm:text-3xl">
          Settings
        </h1>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="mb-5 grid h-auto w-full grid-cols-2 gap-1 p-1 sm:mb-6 sm:grid-cols-4">
            <TabsTrigger
              value="notifications"
              className="flex min-h-10 items-center gap-2 text-xs sm:text-sm"
            >
              <Bell className="h-4 w-4" />
              <span className="truncate">Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="flex min-h-10 items-center gap-2 text-xs sm:text-sm"
            >
              <Lock className="h-4 w-4" />
              <span className="truncate">Privacy</span>
            </TabsTrigger>
            <TabsTrigger
              value="display"
              className="flex min-h-10 items-center gap-2 text-xs sm:text-sm"
            >
              <Palette className="h-4 w-4" />
              <span className="truncate">Display</span>
            </TabsTrigger>
            <TabsTrigger
              value="audio"
              className="flex min-h-10 items-center gap-2 text-xs sm:text-sm"
            >
              <Volume2 className="h-4 w-4" />
              <span className="truncate">Audio</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <div className="space-y-6 rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Bell className="h-5 w-5 text-accent" />
                Notification Settings
              </h2>

              <div className="space-y-4">
                <div className="flex flex-col items-start justify-between gap-3 rounded bg-secondary p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      Live Stream Notifications
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when followed creators go live
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.liveNotifications}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        liveNotifications: e.target.checked,
                      }))
                    }
                    className="h-5 w-5 rounded accent-current"
                  />
                </div>

                <div className="flex flex-col items-start justify-between gap-3 rounded bg-secondary p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      Chat Notifications
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Get notified of messages in streams you&apos;re watching
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.chatNotifications}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        chatNotifications: e.target.checked,
                      }))
                    }
                    className="h-5 w-5 rounded accent-current"
                  />
                </div>

                <div className="flex flex-col items-start justify-between gap-3 rounded bg-secondary p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      Email Updates
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly summaries and news
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailUpdates}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        emailUpdates: e.target.checked,
                      }))
                    }
                    className="h-5 w-5 rounded accent-current"
                  />
                </div>
              </div>

              <Button className="w-full sm:w-auto">
                Save Notification Settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="privacy">
            <div className="space-y-6 rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Lock className="h-5 w-5 text-accent" />
                Privacy & Security
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="profile-visibility" className="text-foreground">
                    Profile Visibility
                  </Label>
                  <Select defaultValue="public">
                    <SelectTrigger className="mt-2 bg-secondary text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="followers-only">
                        Followers Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stream-visibility" className="text-foreground">
                    Stream Visibility
                  </Label>
                  <Select defaultValue="public">
                    <SelectTrigger className="mt-2 bg-secondary text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col items-start justify-between gap-3 rounded bg-secondary p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add extra security to your account
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Enable
                  </Button>
                </div>
              </div>

              <Button className="w-full sm:w-auto">
                Save Privacy Settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="display">
            <div className="space-y-6 rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Palette className="h-5 w-5 text-accent" />
                Display Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="theme" className="text-foreground">
                    Theme
                  </Label>
                  <Select defaultValue="dark">
                    <SelectTrigger className="mt-2 bg-secondary text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language" className="text-foreground">
                    Language
                  </Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="mt-2 bg-secondary text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col items-start justify-between gap-3 rounded bg-secondary p-4 sm:flex-row sm:items-center">
                  <p className="font-medium text-foreground">Compact Mode</p>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded accent-current"
                  />
                </div>
              </div>

              <Button className="w-full sm:w-auto">Save Display Settings</Button>
            </div>
          </TabsContent>

          <TabsContent value="audio">
            <div className="space-y-6 rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Volume2 className="h-5 w-5 text-accent" />
                Audio & Media
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="default-device" className="text-foreground">
                    Default Microphone
                  </Label>
                  <Select defaultValue="default">
                    <SelectTrigger className="mt-2 bg-secondary text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Device</SelectItem>
                      <SelectItem value="usb">USB Microphone</SelectItem>
                      <SelectItem value="headset">Headset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="camera" className="text-foreground">
                    Default Camera
                  </Label>
                  <Select defaultValue="default">
                    <SelectTrigger className="mt-2 bg-secondary text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Camera</SelectItem>
                      <SelectItem value="external">External Camera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="volume" className="text-foreground">
                    Volume Level
                  </Label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="70"
                    className="mt-2 w-full accent-current"
                  />
                </div>
              </div>

              <Button className="w-full sm:w-auto">Save Audio Settings</Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 rounded-lg border border-red-900/20 bg-card p-4 sm:mt-8 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-500">
            <Shield className="h-5 w-5" />
            Account Actions
          </h2>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-2 text-red-500 sm:w-auto"
            >
              <LogOut className="h-4 w-4" />
              Logout from All Devices
            </Button>

            <Button variant="destructive" className="w-full">
              Delete Account
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            These actions are permanent and cannot be undone.
          </p>
        </div>
      </main>
    </div>
  )
}
