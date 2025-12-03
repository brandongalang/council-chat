export interface UsageMetrics {
    /** Number of tokens in the prompt */
    prompt_tokens: number;
    /** Number of tokens in the completion */
    completion_tokens: number;
    /** Total number of tokens used */
    total_tokens: number;
}
