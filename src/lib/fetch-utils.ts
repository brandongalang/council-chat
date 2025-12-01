export async function fetchWithRetry<T>(
    fn: () => Promise<T>,
    options: { maxRetries: number; baseDelay?: number } = { maxRetries: 3, baseDelay: 1000 }
): Promise<T> {
    let attempts = 0;

    while (true) {
        try {
            attempts++;
            return await fn();
        } catch (error: unknown) {
            if (attempts >= options.maxRetries) {
                throw error;
            }

            const delay = (options.baseDelay || 1000) * attempts;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export function parseStreamResponse(fullContent: string) {
    if (!fullContent.includes('__USAGE__:')) {
        return { content: fullContent, usage: null };
    }
    const [content, usageJson] = fullContent.split('__USAGE__:');
    try {
        return { content, usage: JSON.parse(usageJson) };
    } catch {
        return { content, usage: null };
    }
}
