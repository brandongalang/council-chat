export interface ModelPricing {
    prompt: number; // Cost per 1M tokens
    completion: number; // Cost per 1M tokens
}

// Pricing per 1 Million Tokens (approximate, based on OpenRouter/Official docs)
export const MODEL_PRICING: Record<string, ModelPricing> = {
    // OpenAI
    'openai/gpt-4o': { prompt: 5.0, completion: 15.0 },
    'openai/gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
    'openai/gpt-4-turbo': { prompt: 10.0, completion: 30.0 },
    'openai/gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },

    // Anthropic
    'anthropic/claude-3.5-sonnet': { prompt: 3.0, completion: 15.0 },
    'anthropic/claude-3-opus': { prompt: 15.0, completion: 75.0 },
    'anthropic/claude-3-sonnet': { prompt: 3.0, completion: 15.0 },
    'anthropic/claude-3-haiku': { prompt: 0.25, completion: 1.25 },

    // Google
    'google/gemini-pro-1.5': { prompt: 3.5, completion: 10.5 },
    'google/gemini-flash-1.5': { prompt: 0.35, completion: 1.05 },

    // Meta
    'meta-llama/llama-3-70b-instruct': { prompt: 0.9, completion: 0.9 },
    'meta-llama/llama-3-8b-instruct': { prompt: 0.1, completion: 0.1 },

    // Default fallback
    'default': { prompt: 1.0, completion: 1.0 }
};

export function calculateCost(modelId: string, promptTokens: number, completionTokens: number, dynamicPricing?: ModelPricing): number {
    const pricing = dynamicPricing || MODEL_PRICING[modelId] || MODEL_PRICING['default'];

    const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
    const completionCost = (completionTokens / 1_000_000) * pricing.completion;

    return promptCost + completionCost;
}
