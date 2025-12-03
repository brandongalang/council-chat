export interface ModelRate {
    input: number;  // Cost per 1M input tokens
    output: number; // Cost per 1M output tokens
}

export const DEFAULT_RATE: ModelRate = { input: 1.0, output: 1.0 }; // Fallback $1/1M

// Popular models pricing (as of late 2024)
// These serve as fallbacks until we fetch fresh data
export const INITIAL_PRICING: Record<string, ModelRate> = {
    'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
    'anthropic/claude-3-opus': { input: 15.0, output: 75.0 },
    'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
    'openai/gpt-4o': { input: 2.5, output: 10.0 },
    'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
    'google/gemini-pro-1.5': { input: 1.25, output: 3.75 },
    'google/gemini-flash-1.5': { input: 0.075, output: 0.30 },
    'meta-llama/llama-3.1-405b-instruct': { input: 2.0, output: 2.0 },
    'meta-llama/llama-3.1-70b-instruct': { input: 0.4, output: 0.4 },
    'meta-llama/llama-3.1-8b-instruct': { input: 0.05, output: 0.05 },
    'openai/gpt-4-turbo': { input: 10.00, output: 30.00 },
    'openai/gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'mistralai/mistral-large': { input: 8.00, output: 24.00 },
    'x-ai/grok-beta': { input: 0, output: 0 },
    'x-ai/grok-vision-beta': { input: 0, output: 0 },
    'x-ai/grok-2-1212': { input: 0, output: 0 },
    'x-ai/grok-2-vision-1212': { input: 0, output: 0 },
};

/**
 * Calculates cost for a given model usage.
 * @param modelId The model identifier
 * @param inputTokens Number of prompt tokens
 * @param outputTokens Number of completion tokens
 * @param rates Map of model rates (optional, uses defaults if not provided)
 */
export function calculateModelCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    rates: Record<string, ModelRate> = INITIAL_PRICING
): number {
    const rate = rates[modelId] || DEFAULT_RATE;

    const inputCost = (inputTokens / 1_000_000) * rate.input;
    const outputCost = (outputTokens / 1_000_000) * rate.output;

    return inputCost + outputCost;
}
