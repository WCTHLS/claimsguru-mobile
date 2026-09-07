import { create } from 'zustand';
import { scrubPHI } from '../core/utils/phiScrubber';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  scrubbedHits?: string[];
  sources?: string;
  isStreaming?: boolean;
}

const DEFAULT_REPLIES: Record<string, string> = {
  'Summarise this claim':
    'Claim a4f1c9e2 covers a four-day cardiology admission at Sunrise Multispecialty. Rs. 1,84,500 is claimed across eight expense categories, six codes were assigned, and validation left two rules failing. Overall rejection risk is 58 percent — medium.',
  'What documents are missing?':
    'One mandatory document is absent: the pre-authorisation letter. The rest of the IRDAI checklist is complete — hospital bill, discharge summary and KYC are attached and classified.',
  'Why is the risk medium?':
    'Three factors raise it: the missing pre-authorisation reference adds about 18 points, the pharmacy bill predating admission adds 11, and pharmacy spend over the sub-limit adds 7. A clean provider history pulls it back down by 9.',
  'Which rules failed?':
    'Two rules failed: R004 (pharmacy bill dated one day before admission) and R009 (pre-authorisation reference missing). Rules R008 and R011 produced warnings.',
};

interface ChatState {
  messages: ChatMessage[];
  provider: string;
  isStreaming: boolean;
  setProvider: (provider: string) => void;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  provider: 'ollama · llama-3',
  isStreaming: false,
  setProvider: provider => set({ provider }),
  sendMessage: text => {
    if (!text.trim() || get().isStreaming) return;

    const { text: cleanText, hits } = scrubPHI(text);
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: text,
      scrubbedHits: hits.length > 0 ? hits : undefined,
    };

    set(state => ({
      messages: [...state.messages, userMsg],
      isStreaming: true,
    }));

    // Assistant response simulation
    const replyText =
      DEFAULT_REPLIES[text.trim()] ||
      'Across the six indexed documents, the primary issue is the missing pre-authorisation reference. Resolving it would lower the rejection risk by roughly 18 points and satisfy rule R009.';

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'assistant',
        text: replyText,
        sources: 'discharge summary p.1 · hospital bill p.1 · policy card',
      };
      set(state => ({
        messages: [...state.messages, assistantMsg],
        isStreaming: false,
      }));
    }, 800);
  },
  clearMessages: () => set({ messages: [] }),
}));
