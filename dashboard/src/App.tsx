import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Header } from '@/components/layout/header'
import { MessageList } from '@/components/messages/message-list'
import { MessageDetail } from '@/components/messages/message-detail'
import { CommandPalette } from '@/components/command-palette'
import { useTheme } from '@/hooks/use-theme'
import { useWebSocket } from '@/hooks/use-websocket'
import { useKeyboard } from '@/hooks/use-keyboard'
import { useNotifications } from '@/hooks/use-notifications'
import { useAutoRefresh } from '@/hooks/use-messages'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  useTheme()
  useWebSocket()
  useKeyboard()
  useNotifications()
  useAutoRefresh()

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 flex min-h-0">
        <div className="w-full max-w-[400px] min-w-[300px] flex-shrink-0">
          <MessageList />
        </div>
        <div className="flex-1 min-w-0">
          <MessageDetail />
        </div>
      </main>
      <CommandPalette />
      <Toaster position="bottom-right" />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
