/**
 * Pricing rates for various AI models per 1 million tokens.
 * Values are in USD.
 */
export const MODEL_RATES: Record<string, { input: number; output: number }> = {
    'openai/gpt-4o': { input: 5.00, output: 15.00 },
    'openai/gpt-4-turbo': { input: 10.00, output: 30.00 },
    'openai/gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },
    'anthropic/claude-3-opus': { input: 15.00, output: 75.00 },
    'google/gemini-pro-1.5': { input: 3.50, output: 10.50 },
    'google/gemini-flash-1.5': { input: 0.35, output: 1.05 },
    'meta-llama/llama-3.1-70b-instruct': { input: 0.90, output: 0.90 },
    'meta-llama/llama-3.1-405b-instruct': { input: 5.00, output: 15.00 },
    'mistralai/mistral-large': { input: 8.00, output: 24.00 },
};

/**
 * Default pricing rate used when a specific model rate is not found.
 */
export const DEFAULT_RATE = { input: 1.00, output: 1.00 }; // Fallback
