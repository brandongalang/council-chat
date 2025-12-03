import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges class names with Tailwind CSS conflict resolution.
 *
 * @param inputs - A list of class values (strings, objects, arrays) to merge.
 * @returns The merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Result of parsing a judge response with XML tags.
 */
export interface ParsedJudgeResponse {
  /** The reasoning/analysis section (content inside <reasoning> tags) */
  reasoning: string | null;
  /** The final answer section (content inside <answer> tags) */
  answer: string | null;
  /** The raw content if no XML tags were found */
  raw: string;
  /** Whether XML tags were found and parsed */
  hasTags: boolean;
  /** Whether the answer section is complete (has closing tag) */
  answerComplete: boolean;
}

/**
 * Parses a judge response to extract content from <reasoning> and <answer> XML tags.
 * Handles partial/streaming content gracefully.
 *
 * @param content - The raw message content to parse.
 * @returns Parsed response with reasoning and answer separated.
 */
export function parseJudgeResponse(content: string): ParsedJudgeResponse {
  const result: ParsedJudgeResponse = {
    reasoning: null,
    answer: null,
    raw: content,
    hasTags: false,
    answerComplete: false,
  };

  if (!content) return result;

  // Extract reasoning (handles partial streaming)
  const reasoningMatch = content.match(/<reasoning>([\s\S]*?)(?:<\/reasoning>|$)/);
  if (reasoningMatch) {
    result.reasoning = reasoningMatch[1].trim();
    result.hasTags = true;
  }

  // Extract answer (handles partial streaming)
  const answerMatch = content.match(/<answer>([\s\S]*?)(?:<\/answer>|$)/);
  if (answerMatch) {
    result.answer = answerMatch[1].trim();
    result.hasTags = true;
    // Check if the answer section is complete (has closing tag)
    result.answerComplete = content.includes('</answer>');
  }

  return result;
}

/**
 * List of valid HTML tags that should not be escaped.
 * This covers common HTML5 elements that might appear in markdown/content.
 */
const VALID_HTML_TAGS = new Set([
  // Document structure
  'html', 'head', 'body', 'main', 'header', 'footer', 'nav', 'section', 'article', 'aside',
  // Text content
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'br', 'hr',
  // Formatting
  'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small', 'del', 'ins',
  // Links and media
  'a', 'img', 'video', 'audio', 'source', 'iframe', 'figure', 'figcaption',
  // Lists
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // Tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  // Code
  'pre', 'code', 'kbd', 'samp', 'var',
  // Forms (rarely used but valid)
  'form', 'input', 'button', 'select', 'option', 'textarea', 'label', 'fieldset', 'legend',
  // Other common elements
  'blockquote', 'cite', 'q', 'abbr', 'address', 'details', 'summary', 'time', 'wbr',
  // SVG elements (common ones)
  'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'g', 'defs', 'use',
]);

/**
 * Escapes non-standard HTML tags in content to prevent React rendering errors.
 * LLMs sometimes output custom XML-like tags (e.g., <objection>, <example>) that
 * cause React to throw "unrecognized tag" errors when rendered via markdown.
 * 
 * @param content - The raw content that may contain custom tags.
 * @returns Content with non-HTML tags escaped as &lt;tagname&gt;
 */
export function sanitizeCustomTags(content: string): string {
  if (!content) return content;
  
  // Match opening tags: <tagname> or <tagname attr="value">
  // Match closing tags: </tagname>
  // Match self-closing tags: <tagname />
  return content.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*\/?>/g, (match, tagName) => {
    const lowerTag = tagName.toLowerCase();
    if (VALID_HTML_TAGS.has(lowerTag)) {
      return match; // Keep valid HTML tags as-is
    }
    // Escape the angle brackets for non-HTML tags
    return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });
}
