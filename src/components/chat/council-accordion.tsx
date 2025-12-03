'use client';

import * as React from "react"
import { Bot, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { CouncilResponse } from "@/types/council"
import { sanitizeCustomTags } from "@/lib/utils"
import { Streamdown } from "streamdown"

interface CouncilAccordionProps {
  responses: CouncilResponse[]
}

export function CouncilAccordion({ responses }: CouncilAccordionProps) {
  // All items collapsed by default
  const defaultValues: string[] = [];

  return (
    <div className="w-full max-w-3xl border rounded-md my-4 bg-background/50">
      <div className="px-4 py-2 border-b bg-muted/30 text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Bot className="w-3 h-3" />
        Council Deliberation
      </div>
      <Accordion type="multiple" className="w-full" defaultValue={defaultValues}>
        {responses.map((response) => (
          <AccordionItem key={response.instanceId} value={response.instanceId} className="border-b last:border-0">
            <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/20 text-sm group">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-medium font-serif flex items-center gap-2">
                  {response.modelName}
                </span>
                <StatusBadge status={response.status} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 bg-background/30">
              <div className="max-h-[500px] overflow-y-auto pr-2">
                <div className="prose prose-neutral dark:prose-invert max-w-none text-xs font-sans leading-relaxed text-muted-foreground overflow-x-auto">
                  {response.content ? (
                    <Streamdown>{sanitizeCustomTags(response.content)}</Streamdown>
                  ) : (
                    <span className="italic opacity-50">Waiting for output...</span>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

function StatusBadge({ status }: { status: CouncilResponse['status'] }) {
  switch (status) {
    case 'loading':
      return (
        <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1 border-amber-500/50 text-amber-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          Thinking
        </Badge>
      )
    case 'streaming':
      return (
        <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1 border-blue-500/50 text-blue-600 animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          Speaking
        </Badge>
      )
    case 'completed':
      return (
        <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1 border-green-500/50 text-green-600">
          <CheckCircle2 className="w-3 h-3" />
          Done
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="destructive" className="font-mono text-[10px] h-5 gap-1">
          <AlertCircle className="w-3 h-3" />
          Error
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="font-mono text-[10px] h-5">
          Idle
        </Badge>
      )
  }
}
