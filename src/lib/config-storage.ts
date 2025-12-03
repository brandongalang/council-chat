'use client';

export const LAST_CONFIG_KEY = 'council-chat:last-config';

export interface StoredCouncilMember {
  modelId: string;
  persona?: string;
}

export interface StoredCouncilConfig {
  judgeModel: string;
  judgePromptId: string | null;
  judgePrompt?: string;
  members: StoredCouncilMember[];
  sourceCouncilId?: string | null;
}

export function getLastConfig(): StoredCouncilConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LAST_CONFIG_KEY);
    return stored ? JSON.parse(stored) as StoredCouncilConfig : null;
  } catch (error) {
    console.warn('Failed to parse stored council config', error);
    return null;
  }
}

export function saveLastConfig(config: StoredCouncilConfig): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to persist council config', error);
  }
}

