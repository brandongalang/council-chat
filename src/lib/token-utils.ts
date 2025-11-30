/**
 * Estimates the number of tokens in a text string.
 * Uses a rule of thumb where 1 token is approximately 4 characters.
 *
 * @param text - The text to estimate tokens for.
 * @returns The estimated number of tokens.
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    // Rule of thumb: 1 token ~= 4 characters in English
    return Math.ceil(text.length / 4);
}

/**
 * Calculates the cost of an AI model usage based on input and output tokens.
 *
 * @param modelId - The identifier of the AI model.
 * @param inputTokens - The number of input tokens.
 * @param outputTokens - The number of output tokens.
 * @param rates - A record of model rates.
 * @returns The calculated cost in USD.
 */
export function calculateCost(modelId: string, inputTokens: number, outputTokens: number, rates: Record<string, { input: number; output: number }>): number {
    const rate = rates[modelId] || rates['default'] || { input: 1.0, output: 1.0 }; // Fallback
    // Rates are usually per 1M tokens
    const inputCost = (inputTokens / 1_000_000) * rate.input;
    const outputCost = (outputTokens / 1_000_000) * rate.output;
    return inputCost + outputCost;
}
