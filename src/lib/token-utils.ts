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


