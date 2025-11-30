/** Status of a council member during response generation. */
export type CouncilMemberStatus = 'idle' | 'loading' | 'streaming' | 'completed' | 'error';

/**
 * Represents a response from a single council member.
 */
export interface CouncilResponse {
  /** The identifier of the model that generated the response. */
  modelId: string;
  /** Display name of the model. */
  modelName: string;
  /** Current status of the response generation. */
  status: CouncilMemberStatus;
  /** The content of the response. */
  content: string;
  /** Optional custom avatar URL for the model. */
  avatar?: string; // Optional custom avatar
}

/**
 * Represents a council session configuration and history.
 */
export interface CouncilSession {
  /** Array of model IDs participating in the council. */
  councilMembers: string[]; // Array of model IDs
  /** The model ID designated as the Judge. */
  judgeModel: string;
  /** Map of message IDs to their corresponding council responses. */
  responses: Record<string, CouncilResponse[]>; // Map of messageId -> responses
}
