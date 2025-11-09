export type GenerationStatus = 'IDLE' | 'GENERATING' | 'COMPLETE' | 'ERROR';

export type ProgressStepStatus = 'pending' | 'running' | 'complete' | 'error';

export interface ProgressStep {
  id: 'script' | 'image' | 'audio';
  label: string;
  status: ProgressStepStatus;
}

export type VoiceOption = 'Charon' | 'Achernar' | 'Puck' | 'Kore' | 'Zephyr' | 'Gacrux' | 'Fenrir';

export interface TimedScriptChunk {
  text: string;
  start: number;
  end: number;
}

export interface ReelContent {
  script: string[];
  timedScript: TimedScriptChunk[];
  imagePrompt: string;
  imageUrls: string[];
  audioB64: string;
  sources?: {
    uri: string;
    title: string;
  }[];
  hashtags?: string[];
}

export interface TopicCategory {
  category: string;
  topics: string[];
}