export interface EmailAddress {
  Relays: string[] | null
  Mailbox: string
  Domain: string
  Params: string
}

export interface Content {
  Headers: Record<string, string[]>
  Body: string
  Size: number
  MIME: MIMEPart | null
}

export interface MIMEPart {
  Headers: Record<string, string[]>
  Body: string
  Size: number
  Parts?: MIMEPart[]
}

export interface Message {
  ID: string
  From: EmailAddress
  To: EmailAddress[]
  Content: Content
  Created: string
  MIME: MIMEPart | null
  Raw: {
    From: string
    To: string[]
    Data: string
    Helo: string
  }
}

export interface MessagesResponse {
  total: number
  count: number
  start: number
  items: Message[]
}

export type SearchKind = 'from' | 'to' | 'containing'

export interface SearchParams {
  kind: SearchKind
  query: string
}
