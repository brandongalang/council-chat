export function estimateTokens(text: string): number {
    if (!text) return 0;
    // Rule of thumb: 1 token ~= 4 characters in English
    return Math.ceil(text.length / 4);
}

export function calculateCost(modelId: string, inputTokens: number, outputTokens: number, rates: Record<string, { input: number; output: number }>): number {
    const rate = rates[modelId] || rates['default'] || { input: 1.0, output: 1.0 }; // Fallback
    // Rates are usually per 1M tokens
    const inputCost = (inputTokens / 1_000_000) * rate.input;
    const outputCost = (outputTokens / 1_000_000) * rate.output;
    return inputCost + outputCost;
}
