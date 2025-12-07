import { CouncilResponse } from '@/types/council';
import { estimateTokens } from '@/lib/token-utils';
import type { UsageMetrics } from '@/types/usage';

export function formatTokens(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return Math.round(value).toLocaleString();
}

export function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function normalizeAnnotations(raw: unknown): unknown[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function extractCouncilResponses(annotations?: unknown[]): CouncilResponse[] | undefined {
  if (!annotations) return undefined;
  return annotations.find((entry) =>
    Array.isArray(entry) &&
    entry.some((item) => item && typeof item === 'object' && 'modelId' in item && 'status' in item)
  ) as CouncilResponse[] | undefined;
}

export function extractUsage(response: CouncilResponse): number {
  const usage = (response as { usage?: UsageMetrics }).usage;
  if (usage) {
    const prompt = usage.prompt_tokens ?? usage.promptTokens ?? 0;
    const completion = usage.completion_tokens ?? usage.completionTokens ?? 0;
    const total = prompt + completion;
    if (total > 0) return total;
  }

  if (response.content) {
    return estimateTokens(response.content);
  }

  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTokenValue(source: any, snake: string, camel: string): number {
  const value = source?.[snake] ?? source?.[camel];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function parseCost(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

