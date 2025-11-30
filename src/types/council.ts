export type CouncilMemberStatus = 'idle' | 'loading' | 'streaming' | 'completed' | 'error';

export interface CouncilResponse {
  modelId: string;
  modelName: string;
  status: CouncilMemberStatus;
  content: string;
  avatar?: string; // Optional custom avatar
  promptTokens?: number;
  completionTokens?: number;
}

export interface CouncilSession {
  councilMembers: string[]; // Array of model IDs
  judgeModel: string;
  responses: Record<string, CouncilResponse[]>; // Map of messageId -> responses
}
