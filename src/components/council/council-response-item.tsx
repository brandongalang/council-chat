import { CouncilResponse } from '@/types/council';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CouncilResponseItemProps {
    response: CouncilResponse;
}

export function CouncilResponseItem({ response }: CouncilResponseItemProps) {
    const isStreaming = response.status === 'streaming';
    const isLoading = response.status === 'loading';
    const isCompleted = response.status === 'completed';
    const isError = response.status === 'error';

    // Simple token estimation (4 chars per token approx)
    const tokenCount = Math.round(response.content.length / 4);

    return (
        <AccordionItem value={response.modelId} className="border rounded-md px-4 bg-card">
            <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3 w-full">
                    {/* Status Icon */}
                    <div className="shrink-0">
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {isStreaming && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                        {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {isError && <XCircle className="h-4 w-4 text-red-500" />}
                    </div>

                    {/* Model Name */}
                    <span className="text-sm font-medium">{response.modelName}</span>

                    {/* Metadata (Right Aligned) */}
                    <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground mr-2">
                        {isStreaming && <span className="animate-pulse">Thinking...</span>}
                        {(isCompleted || isStreaming) && <span>{tokenCount} tok</span>}
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    {response.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {response.content}
                        </ReactMarkdown>
                    ) : (
                        <span className="italic opacity-50">Waiting for response...</span>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
