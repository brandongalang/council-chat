import { CouncilResponse } from "@/types/council"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useState } from "react"
import { estimateTokens, calculateCost } from "@/lib/token-utils"
import { MODEL_RATES, DEFAULT_RATE } from "@/lib/constants"

interface CouncilResponseItemProps {
    response: CouncilResponse
}

export function CouncilResponseItem({ response }: CouncilResponseItemProps) {
    const [isOpen, setIsOpen] = useState(true)

    // Estimate tokens
    const outputTokens = estimateTokens(response.content);
    // Input tokens are harder to estimate without the full context, but we can assume a base or ignore for now.
    // Let's just track output cost for the stream visualization as it's the dynamic part.
    const cost = calculateCost(response.modelId, 0, outputTokens, { ...MODEL_RATES, default: DEFAULT_RATE });

    return (
        <Card className="mb-4 border-l-4" style={{ borderLeftColor: getStatusColor(response.status) }}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">{response.modelName}</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-normal">
                        {response.modelId}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    {response.status === 'loading' && <Loader2 className="h-3 w-3 animate-spin" />}
                    {response.status === 'streaming' && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}

                    <div className="flex flex-col items-end text-[10px] text-muted-foreground mr-2">
                        <span>{outputTokens} tok</span>
                        <span>${cost.toFixed(5)}</span>
                    </div>

                    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                        <CollapsibleTrigger asChild>
                            <button className="hover:bg-muted p-1 rounded">
                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                        </CollapsibleTrigger>
                    </Collapsible>
                </div>
            </CardHeader>
            <CollapsibleContent>
                <CardContent className="py-3 px-4 text-sm prose dark:prose-invert max-w-none">
                    {response.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {response.content}
                        </ReactMarkdown>
                    ) : (
                        <span className="text-muted-foreground italic">Waiting for response...</span>
                    )}
                </CardContent>
            </CollapsibleContent>
        </Card>
    )
}

function getStatusColor(status: CouncilResponse['status']) {
    switch (status) {
        case 'loading': return '#fbbf24'; // amber-400
        case 'streaming': return '#3b82f6'; // blue-500
        case 'completed': return '#22c55e'; // green-500
        case 'error': return '#ef4444'; // red-500
        default: return '#94a3b8'; // slate-400
    }
}
