
export interface Clip {
  id: number;
  title: string;
  start: number;
  end: number;
  hook: string;
  caption: string;
  highlighted_keywords: string[];
}

export interface BrandSettings {
  logo: string | null;
  accentColor: string;
  font: 'font-sans' | 'font-poppins' | 'font-roboto';
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ConversationResponse {
  text?: string;
  functionCall?: {
    name: string;
    args: any;
  };
}
