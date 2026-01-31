import {
  RefreshCw,
  Search,
  Trash2,
  Moon,
  Sun,
  Monitor,
  Bell,
  BellOff,
  ArrowDown,
  ArrowUp,
  X,
  Github,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useUIStore } from '@/stores/ui-store'
import { useKeyboard } from '@/hooks/use-keyboard'
import { useDeleteAllMessages, useRefreshMessages } from '@/hooks/use-messages'
import { useTheme } from '@/hooks/use-theme'

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    notificationsEnabled,
    setNotificationsEnabled,
    selectedMessageId,
    setSelectedMessageId,
  } = useUIStore()
  const { theme, setTheme } = useTheme()
  const {
    selectNextMessage,
    selectPreviousMessage,
    deleteSelectedMessage,
    focusSearch,
  } = useKeyboard()
  const { refresh: refreshMessages, isRefreshing } = useRefreshMessages()
  const deleteAllMutation = useDeleteAllMessages()

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false)
    command()
  }

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(selectNextMessage)}>
            <ArrowDown className="mr-2 h-4 w-4" />
            Next message
            <CommandShortcut>J</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(selectPreviousMessage)}>
            <ArrowUp className="mr-2 h-4 w-4" />
            Previous message
            <CommandShortcut>K</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(focusSearch)}>
            <Search className="mr-2 h-4 w-4" />
            Focus search
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(refreshMessages)} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing messages...' : 'Refresh messages'}
            <CommandShortcut>R</CommandShortcut>
          </CommandItem>
          {selectedMessageId && (
            <>
              <CommandItem onSelect={() => runCommand(() => setSelectedMessageId(null))}>
                <X className="mr-2 h-4 w-4" />
                Close message
                <CommandShortcut>Esc</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(deleteSelectedMessage)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete selected message
                <CommandShortcut>D</CommandShortcut>
              </CommandItem>
            </>
          )}
          <CommandItem
            onSelect={() => runCommand(() => deleteAllMutation.mutate())}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete all messages
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem
            onSelect={() => runCommand(() => setTheme('light'))}
            className={theme === 'light' ? 'bg-accent' : ''}
          >
            <Sun className="mr-2 h-4 w-4" />
            Light theme
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setTheme('dark'))}
            className={theme === 'dark' ? 'bg-accent' : ''}
          >
            <Moon className="mr-2 h-4 w-4" />
            Dark theme
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setTheme('system'))}
            className={theme === 'system' ? 'bg-accent' : ''}
          >
            <Monitor className="mr-2 h-4 w-4" />
            System theme
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem
            onSelect={() =>
              runCommand(() => setNotificationsEnabled(!notificationsEnabled))
            }
          >
            {notificationsEnabled ? (
              <>
                <BellOff className="mr-2 h-4 w-4" />
                Disable notifications
              </>
            ) : (
              <>
                <Bell className="mr-2 h-4 w-4" />
                Enable notifications
              </>
            )}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Links">
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                window.open('https://github.com/mailhog/MailHog', '_blank')
              )
            }
          >
            <Github className="mr-2 h-4 w-4" />
            View on GitHub
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
