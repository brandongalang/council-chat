export type CouncilMemberStatus = 'idle' | 'loading' | 'streaming' | 'completed' | 'error';

export interface CouncilResponse {
  modelId: string;
  modelName: string;
  status: CouncilMemberStatus;
  content: string;
  avatar?: string; // Optional custom avatar
}

export interface CouncilSession {
  councilMembers: string[]; // Array of model IDs
  judgeModel: string;
  responses: Record<string, CouncilResponse[]>; // Map of messageId -> responses
}
