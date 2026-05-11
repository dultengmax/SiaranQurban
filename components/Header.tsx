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
import { Compass, Home, LogOut, Radio, Settings, User } from 'lucide-react'

export function Header() {
  const pathname = usePathname()

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/')

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-lg font-bold text-accent sm:text-xl"
        >
          <span>StreamStudio</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button asChild variant={isActive('/') ? 'default' : 'ghost'}>
            <Link href="/" className="gap-2">
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant={isActive('/discover') ? 'default' : 'ghost'}>
            <Link href="/discover" className="gap-2">
              <Compass className="w-4 h-4" />
              Discover
            </Link>
          </Button>
          <Button asChild variant={isActive('/studio') ? 'default' : 'ghost'}>
            <Link href="/studio" className="gap-2">
              <Radio className="w-4 h-4" />
              Studio
            </Link>
          </Button>
        </nav>

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

      <nav className="border-t border-border px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 md:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-1">
          <Link
            href="/"
            className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors ${
              isActive('/')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/discover"
            className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors ${
              isActive('/discover')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Compass className="h-4 w-4" />
            Discover
          </Link>
          <Link
            href="/studio"
            className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors ${
              isActive('/studio')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Radio className="h-4 w-4" />
            Studio
          </Link>
        </div>
      </nav>
    </header>
  )
}
