import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function ConnectionStatus() {
  const { isConnected } = useUIStore()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isConnected
                ? 'bg-green-500 animate-pulse-dot'
                : 'bg-red-500'
            )}
          />
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {isConnected
          ? 'Connected to WebSocket - receiving live updates'
          : 'WebSocket disconnected - attempting to reconnect'}
      </TooltipContent>
    </Tooltip>
  )
}
