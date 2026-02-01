import { Mail, Moon, Sun, Monitor, Github, Search, Bell, BellOff, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ConnectionStatus } from '@/components/connection-status'
import { useTheme } from '@/hooks/use-theme'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import type { SearchKind } from '@/api/types'

const SEARCH_KINDS: { value: SearchKind; label: string }[] = [
  { value: 'containing', label: 'Containing' },
  { value: 'from', label: 'From' },
  { value: 'to', label: 'To' },
]

export function Header() {
  const { theme, setTheme } = useTheme()
  const {
    searchQuery,
    searchKind,
    setSearchQuery,
    setSearchKind,
    setCommandPaletteOpen,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useUIStore()
  const { email, logout } = useAuthStore()

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          setNotificationsEnabled(true)
        }
      }
    } else {
      setNotificationsEnabled(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6" />
          <span className="font-semibold text-lg hidden sm:inline">MailHog</span>
        </div>

        <div className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1 flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 h-full px-3 rounded-r-none border-r"
                >
                  {SEARCH_KINDS.find((k) => k.value === searchKind)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Search by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SEARCH_KINDS.map((kind) => (
                  <DropdownMenuItem
                    key={kind.value}
                    onClick={() => setSearchKind(kind.value)}
                  >
                    {kind.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Input
              id="search-input"
              type="search"
              placeholder="Search messages... (press /)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-28 pr-10"
            />
            <Search className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionStatus />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNotificationToggle}
              >
                {notificationsEnabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {notificationsEnabled
                ? 'Disable notifications'
                : 'Enable notifications'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
                onClick={() => setCommandPaletteOpen(true)}
              >
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open command palette</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {theme === 'light' && <Sun className="h-4 w-4" />}
                {theme === 'dark' && <Moon className="h-4 w-4" />}
                {theme === 'system' && <Monitor className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://github.com/mailhog/MailHog"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View on GitHub</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Sign out{email ? ` (${email})` : ''}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
