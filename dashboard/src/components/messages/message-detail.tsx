import { Download, Trash2, Mail, Copy, Check, Server, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
import { useMessage, useDeleteMessage } from '@/hooks/use-messages'
import { useUIStore } from '@/stores/ui-store'
import { formatDate, decodeContent } from '@/lib/utils'
import type { Message, MIMEPart } from '@/api/types'

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Separator />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 mr-1" />
          <span className="text-xs">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 mr-1" />
          <span className="text-xs">{label || 'Copy'}</span>
        </>
      )}
    </Button>
  )
}

function SMTPConnectionInfo() {
  return (
    <div className="mt-6 w-full max-w-2xl space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Server className="h-4 w-4" />
        <span className="text-sm font-medium">SMTP Connection Details</span>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground w-[140px]">Sender name:</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-mono">Appwrite Noreply</span>
            <CopyButton value="Appwrite Noreply" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground w-[140px]">Sender email:</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-mono">noreply@test.appwrite.org</span>
            <CopyButton value="noreply@test.appwrite.org" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground w-[140px]">Reply to:</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-mono text-muted-foreground">(empty)</span>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground w-[140px]">Server host:</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-mono">shortline.proxy.rlwy.net</span>
            <CopyButton value="shortline.proxy.rlwy.net" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground w-[140px]">Server port:</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-mono">56260</span>
            <CopyButton value="56260" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground w-[140px]">Username:</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-mono text-muted-foreground">(empty)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground w-[140px]">Password:</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-mono text-muted-foreground">(empty)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground w-[140px]">Secure protocol:</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-mono">None</span>
            <CopyButton value="None" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 overflow-y-auto">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Mail className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg">Select a message</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Choose a message from the list to view its contents.
      </p>
      <p className="text-xs text-muted-foreground mt-3">
        Tip: Use <kbd className="px-1 py-0.5 rounded bg-muted text-xs">J</kbd> and{' '}
        <kbd className="px-1 py-0.5 rounded bg-muted text-xs">K</kbd> to navigate
      </p>
      
      <SMTPConnectionInfo />
    </div>
  )
}

function getFromEmail(message: Message): string {
  return `${message.From.Mailbox}@${message.From.Domain}`
}

function getToEmails(message: Message): string[] {
  return message.To.map((to) => `${to.Mailbox}@${to.Domain}`)
}

function getSubject(message: Message): string {
  const headers = message.Content.Headers
  return headers['Subject']?.[0] || headers['subject']?.[0] || '(No Subject)'
}

function getPlainTextBody(message: Message): string {
  if (message.MIME?.Parts) {
    const plainPart = findMimePart(message.MIME.Parts, 'text/plain')
    if (plainPart) {
      const encoding = plainPart.Headers['Content-Transfer-Encoding']?.[0] || ''
      return decodeContent(plainPart.Body, encoding)
    }
  }
  const encoding = message.Content.Headers['Content-Transfer-Encoding']?.[0] || ''
  return decodeContent(message.Content.Body, encoding)
}

function getHtmlBody(message: Message): string | null {
  if (message.MIME?.Parts) {
    const htmlPart = findMimePart(message.MIME.Parts, 'text/html')
    if (htmlPart) {
      const encoding = htmlPart.Headers['Content-Transfer-Encoding']?.[0] || ''
      return decodeContent(htmlPart.Body, encoding)
    }
  }
  const contentType = message.Content.Headers['Content-Type']?.[0] || ''
  if (contentType.includes('text/html')) {
    const encoding = message.Content.Headers['Content-Transfer-Encoding']?.[0] || ''
    return decodeContent(message.Content.Body, encoding)
  }
  return null
}

function findMimePart(parts: MIMEPart[], contentType: string): MIMEPart | null {
  for (const part of parts) {
    const type = part.Headers['Content-Type']?.[0] || ''
    if (type.includes(contentType)) return part
    if (part.Parts) {
      const found = findMimePart(part.Parts, contentType)
      if (found) return found
    }
  }
  return null
}

function HeadersView({ message }: { message: Message }) {
  const headers = message.Content.Headers

  return (
    <div className="font-mono text-sm space-y-1">
      {Object.entries(headers).map(([key, values]) => (
        <div key={key} className="flex">
          <span className="text-muted-foreground min-w-[120px]">{key}:</span>
          <span className="flex-1 break-all">{values.join(', ')}</span>
        </div>
      ))}
    </div>
  )
}

function HtmlPreview({ html }: { html: string }) {
  const sanitizedHtml = html

  return (
    <div className="border rounded-md bg-white dark:bg-zinc-900 overflow-hidden">
      <iframe
        srcDoc={sanitizedHtml}
        className="w-full h-[400px] border-0"
        sandbox="allow-same-origin"
        title="Email HTML preview"
      />
    </div>
  )
}

export function MessageDetail() {
  const { selectedMessageId, setSelectedMessageId } = useUIStore()
  const { data: message, isLoading, isError, error } = useMessage(selectedMessageId)
  const deleteMutation = useDeleteMessage()

  if (!selectedMessageId) {
    return <EmptyState />
  }

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="font-medium text-destructive">Failed to load message</p>
        <p className="text-sm text-muted-foreground mt-1">
          {(error as Error).message}
        </p>
      </div>
    )
  }

  if (!message) {
    return <EmptyState />
  }

  const fromEmail = getFromEmail(message)
  const toEmails = getToEmails(message)
  const subject = getSubject(message)
  const plainText = getPlainTextBody(message)
  const htmlBody = getHtmlBody(message)

  const handleDownload = () => {
    const blob = new Blob([message.Raw.Data], { type: 'message/rfc822' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${message.ID}.eml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setSelectedMessageId(null)
  }

  const handleDelete = () => {
    deleteMutation.mutate(message.ID, {
      onSuccess: () => {
        setSelectedMessageId(null)
      },
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{fromEmail}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              To: {toEmails.join(', ')}
            </div>
            <h2 className="text-lg font-semibold mt-2 break-words">{subject}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(message.Created)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close (Esc)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download .eml</TooltipContent>
            </Tooltip>

            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Delete (D)</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this message. This action cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="plain" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-2">
          <TabsList>
            <TabsTrigger value="plain">Plain</TabsTrigger>
            {htmlBody && <TabsTrigger value="html">HTML</TabsTrigger>}
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="plain" className="p-4 mt-0">
            <pre className="whitespace-pre-wrap font-mono text-sm break-words">
              {plainText}
            </pre>
          </TabsContent>

          {htmlBody && (
            <TabsContent value="html" className="p-4 mt-0">
              <HtmlPreview html={htmlBody} />
            </TabsContent>
          )}

          <TabsContent value="headers" className="p-4 mt-0">
            <HeadersView message={message} />
          </TabsContent>

          <TabsContent value="raw" className="p-4 mt-0">
            <pre className="whitespace-pre-wrap font-mono text-xs break-all bg-muted p-4 rounded-md overflow-x-auto">
              {message.Raw.Data}
            </pre>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
