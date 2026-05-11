'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {  Home, Compass, User, LogOut, Settings } from 'lucide-react'

export function Header() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-accent">
          <span>StreamStudio</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/discover">
            <Button
              variant={isActive('/discover') ? 'default' : 'ghost'}
              className="gap-2"
            >
              <Compass className="w-4 h-4" />
              Discover
            </Button>
          </Link>
          <Link href="/studio">
            <Button
              variant={isActive('/studio') ? 'default' : 'ghost'}
              className="gap-2"
            >
              Studio
            </Button>
          </Link>
        </nav>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
