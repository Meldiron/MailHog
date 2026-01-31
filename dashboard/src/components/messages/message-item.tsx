import { cn, formatRelativeTime, getInitials } from '@/lib/utils'
import type { Message } from '@/api/types'

interface MessageItemProps {
  message: Message
  isSelected: boolean
  onSelect: () => void
}

function getFromEmail(message: Message): string {
  return `${message.From.Mailbox}@${message.From.Domain}`
}

function getToEmail(message: Message): string {
  if (message.To.length === 0) return ''
  const first = message.To[0]
  return `${first.Mailbox}@${first.Domain}`
}

function getSubject(message: Message): string {
  const headers = message.Content.Headers
  const subject = headers['Subject']?.[0] || headers['subject']?.[0]
  return subject || '(No Subject)'
}

export function MessageItem({ message, isSelected, onSelect }: MessageItemProps) {
  const fromEmail = getFromEmail(message)
  const toEmail = getToEmail(message)
  const subject = getSubject(message)
  const initials = getInitials(fromEmail)
  const relativeTime = formatRelativeTime(message.Created)

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-3 border-b transition-colors hover:bg-accent/50 focus:outline-none focus:bg-accent/50',
        isSelected && 'bg-accent'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium',
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate">{fromEmail}</span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {relativeTime}
            </span>
          </div>
          <p className="text-sm truncate mt-0.5">{subject}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            <span className="opacity-70">→</span> {toEmail}
          </p>
        </div>
      </div>
    </button>
  )
}
