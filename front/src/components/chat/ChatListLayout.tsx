import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cleanTitle } from "@/utils/chat-utils"

export type ChatListItem = {
  id: string
  title: string
  contactName?: string
  contactPhoneE164: string
  lastMessagePreview?: string
  unreadCount: number
  lastMessageAt?: string
}

export type TicketState =
  | "novo"
  | "em_atendimento"
  | "finalizado"

export type ChatTicket = {
  status: TicketState
  assignedTo?: string
}

type ChatListLayoutProps = {
  chats: ChatListItem[]
  ticketsById?: Record<string, ChatTicket | undefined>
  selectedId?: string | null
  onSelect?: (id: string) => void
  onAttend?: (id: string) => void
  className?: string
}

export function ChatListLayout({
  chats,
  ticketsById,
  selectedId,
  onSelect,
  onAttend,
  className,
}: ChatListLayoutProps) {
  return (
    <div className={cn("w-full flex flex-col gap-2 px-2 py-2", className)}>
      {chats.map((c, idx) => {
        const queueNumber = String(idx + 1).padStart(2, "0")
        const t = ticketsById?.[c.id]
        const statusLabel =
          t?.status === "finalizado"
            ? "Finalizado"
            : t?.status === "em_atendimento"
            ? `Em Atendimento${t.assignedTo ? `: ${t.assignedTo}` : ""}`
            : "Novo"
        const statusColor =
          t?.status === "finalizado"
            ? "bg-gray-200 text-gray-700"
            : t?.status === "em_atendimento"
            ? "bg-blue-100 text-blue-700"
            : "bg-amber-100 text-amber-700"

        const title = cleanTitle(c.title, c.contactName, c.contactPhoneE164)

        return (
          <div
            key={c.id}
            role="button"
            onClick={() => onSelect?.(c.id)}
            className={cn(
              "w-full box-border p-3 rounded-lg bg-white shadow-sm",
              "ring-1 ring-slate-200/70 hover:shadow-md transition-all cursor-pointer",
              selectedId === c.id && "ring-2 ring-primary bg-primary/5"
            )}
          >
            <div className="flex items-center gap-2">
              {/* Avatar/posição (menor) */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/90 to-primary/60 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {queueNumber}
              </div>

              {/* Conteúdo (pode truncar) */}
              <div className="flex-1 min-w-0">
                {/* Linha do título + badge */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 truncate text-sm font-semibold leading-4">
                    {title}
                  </div>
                  {c.unreadCount && c.unreadCount > 0 ? (
                    <div className="shrink-0">
                      <Badge className="rounded-full px-1.5 py-0 text-[8px] leading-none bg-green-500 text-white">
                        {c.unreadCount}
                      </Badge>
                    </div>
                  ) : null}
                </div>

                {/* Subtítulo / preview */}
                <div className="text-slate-500 text-xs leading-4 truncate mt-0.5">
                  {c.lastMessagePreview || c.contactPhoneE164 || ""}
                </div>

                {/* Chips / ações */}
                <div className="flex flex-wrap gap-1 mt-1">
                  <span
                    className={cn(
                      "text-[8px] rounded-full px-1.5 py-[1px] shrink-0",
                      statusColor
                    )}
                  >
                    {statusLabel}
                  </span>
                  {t?.status === "novo" && (
                    <Button
                      size="sm"
                      className="h-5 px-1.5 py-0 shrink-0 text-[8px]"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAttend?.(c.id)
                      }}
                    >
                      Atender
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
