// index.d.ts

export type Input =
  | {
      prompt: string;
    }
  | {
      messages: ChatMessage[];
    };

export type Output =
  | {
      text: string;
    }
  | {
      message: ChatMessage;
    };

type LLM =
  | "openai/gpt3.5"
  | "together/gpt-neoxt-20B"
  | "cohere/xlarge"
  | "local";

export interface CompletionOptions {
  onStreamResult?: (result: Output | null, error: string | null) => unknown;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  model?: LLM;
}

export interface ChatMessage {
  content: string;
  role: string;
}

export function getCurrentModel(): Promise<LLM>;

export function getCompletion(
  input: Input,
  options?: CompletionOptions
): Promise<Output>;

// This part is for the global augmentation
declare global {
  interface WindowAI {
    getCurrentModel: typeof getCurrentModel;
    getCompletion: typeof getCompletion;
  }

  interface Window {
    ai: WindowAI;
  }
}

export {}; // This is necessary for module augmentation
