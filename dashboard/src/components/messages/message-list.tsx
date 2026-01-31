import { RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MessageItem } from './message-item'
import { useMessages, useDeleteAllMessages } from '@/hooks/use-messages'
import { useUIStore } from '@/stores/ui-store'
import { useQueryClient } from '@tanstack/react-query'

function MessageListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-3 border-b">
          <div className="flex items-start gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="font-medium text-lg">No messages yet</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Send an email to your MailHog SMTP server to see it here.
      </p>
    </div>
  )
}

export function MessageList() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error } = useMessages()
  const deleteAllMutation = useDeleteAllMessages()
  const { selectedMessageId, setSelectedMessageId } = useUIStore()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['messages'] })
  }

  const handleDeleteAll = () => {
    deleteAllMutation.mutate()
  }

  const messages = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="flex flex-col h-full border-r">
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-medium">
          {total} {total === 1 ? 'message' : 'messages'}
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh (R)</TooltipContent>
          </Tooltip>

          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={messages.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Delete all messages</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all messages?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {total} messages. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <MessageListSkeleton />
        ) : isError ? (
          <div className="p-4 text-center text-destructive">
            <p className="font-medium">Failed to load messages</p>
            <p className="text-sm mt-1">{(error as Error).message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="mt-3"
            >
              Try again
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {messages.map((message) => (
              <MessageItem
                key={message.ID}
                message={message}
                isSelected={selectedMessageId === message.ID}
                onSelect={() => setSelectedMessageId(message.ID)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
