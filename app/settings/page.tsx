'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bell,
  Lock,
  Palette,
  Volume2,
  Shield,
  LogOut,
} from 'lucide-react'

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    liveNotifications: true,
    chatNotifications: true,
    emailUpdates: false,
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Display</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Audio</span>
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                Notification Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary rounded">
                  <div>
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
                    className="w-5 h-5 rounded accent-current"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary rounded">
                  <div>
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
                    className="w-5 h-5 rounded accent-current"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary rounded">
                  <div>
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
                    className="w-5 h-5 rounded accent-current"
                  />
                </div>
              </div>

              <Button>Save Notification Settings</Button>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent" />
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

                <div className="flex items-center justify-between p-4 bg-secondary rounded">
                  <div>
                    <p className="font-medium text-foreground">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add extra security to your account
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
              </div>

              <Button>Save Privacy Settings</Button>
            </div>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Palette className="w-5 h-5 text-accent" />
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

                <div className="flex items-center justify-between p-4 bg-secondary rounded">
                  <p className="font-medium text-foreground">
                    Compact Mode
                  </p>
                  <input type="checkbox" className="w-5 h-5 rounded accent-current" />
                </div>
              </div>

              <Button>Save Display Settings</Button>
            </div>
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-accent" />
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
                    className="w-full mt-2 accent-current"
                  />
                </div>
              </div>

              <Button>Save Audio Settings</Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Account Danger Zone */}
        <div className="mt-8 bg-card border border-red-900/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-500 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" />
            Account Actions
          </h2>

          <div className="space-y-3">
            <Button variant="outline" className="gap-2 text-red-500">
              <LogOut className="w-4 h-4" />
              Logout from All Devices
            </Button>

            <Button
              variant="destructive"
              className="w-full"
            >
              Delete Account
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            These actions are permanent and cannot be undone.
          </p>
        </div>
      </main>
    </div>
  )
}
