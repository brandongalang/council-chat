/**
 * Shared helpers for extracting message content across server and client.
 */
type MessageLike = {
  parts?: Array<{ type?: string; text?: string | null | undefined } | null | undefined>;
  content?: unknown;
  text?: unknown;
};

/**
 * Extracts string content from AI SDK style messages, legacy message objects, or plain strings.
 * Handles the `parts` array introduced in AI SDK v5 and falls back to `content`/`text`.
 */
export function getMessageContent(message: unknown): string {
  if (message == null) {
    return '';
  }

  if (typeof message === 'string') {
    return message;
  }

  const candidate = message as MessageLike;

  if (Array.isArray(candidate.parts)) {
    return candidate.parts
      .filter((part): part is { type?: string; text?: string | null | undefined } => Boolean(part))
      .filter(part => part.type === 'text')
      .map(part => part.text ?? '')
      .join('');
  }

  const fallback = candidate.content ?? candidate.text;
  return typeof fallback === 'string' ? fallback : '';
}

