// Use database schema types as source of truth
// export type CouncilResponseDB = InferSelectModel<typeof councilResponses>;

export type CouncilMemberStatus =
  | 'idle'
  | 'loading'
  | 'streaming'
  | 'completed'
  | 'error';

export interface CouncilResponse {
  modelId: string;
  modelName: string;
  status: CouncilMemberStatus;
  content: string;
  avatar?: string;
  errorMessage?: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface CouncilMember {
  modelId: string;
  persona?: string; // DEPRECATED: Use promptTemplateId or customPrompt
  promptTemplateId?: string; // Reference to COUNCIL_MEMBER_PROMPTS
  customPrompt?: string; // For ad-hoc overrides
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  judge_model?: string;
  judge_settings?: string;
  models: {
    model_id: string;
    prompt_template_id?: string;
    system_prompt_override?: string;
  }[];
  created_at?: string;
}

export interface CouncilSession {
  councilMembers: string[]; // Array of model IDs
  judgeModel: string;
  responses: Record<string, CouncilResponse[]>; // Map of messageId -> responses
}
