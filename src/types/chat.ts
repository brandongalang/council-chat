import type { UIMessage } from '@ai-sdk/react';
import type { CouncilResponse } from './council';

export type JudgeAnnotation = {
  judgeModel: string;
  isPending?: boolean;
  isSynthesizing?: boolean;
};

export type MessageAnnotation = CouncilResponse[] | JudgeAnnotation;

export type ChatMessage = UIMessage & {
  id: string;
  annotations?: MessageAnnotation[];
  prompt_tokens?: number;
  promptTokens?: number;
  completion_tokens?: number;
  completionTokens?: number;
  cost?: number | string;
  created_at?: string;
  createdAt?: string;
};

