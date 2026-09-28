import { Item, VisualMatchResult } from '../types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GroundingCitation {
  title: string;
  uri: string;
}

export interface MapPlace {
  title: string;
  uri: string;
}

export interface AutoTagsResult {
  category: string;
  categoryConfidence: number;
  locationTags: string[];
  descriptorTags: string[];
  detectedLocationName?: string;
  suggestedEvidenceQuestion?: string;
  rationale?: string;
}

export interface ChatResponse {
  text: string;
  groundingChunks?: any[];
  model: string;
}

export class GeminiClient {
  static async sendChat(params: {
    messages: ChatMessage[];
    model?: string;
    systemInstruction?: string;
    useSearch?: boolean;
    useMaps?: boolean;
    location?: { lat: number; lng: number };
  }): Promise<ChatResponse> {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Chat request failed with status ${res.status}`);
    }

    return res.json();
  }

  static async searchGrounding(prompt: string, itemContext?: string): Promise<{
    text: string;
    citations: GroundingCitation[];
  }> {
    const res = await fetch('/api/gemini/search-grounding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, itemContext }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Search grounding failed with status ${res.status}`);
    }

    return res.json();
  }

  static async mapsGrounding(prompt: string, location?: { lat: number; lng: number }): Promise<{
    text: string;
    places: MapPlace[];
    groundingChunks: any[];
  }> {
    const res = await fetch('/api/gemini/maps-grounding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, location }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Maps grounding failed with status ${res.status}`);
    }

    return res.json();
  }

  static async getAutoTags(params: {
    title: string;
    description: string;
    locationName?: string;
    type?: string;
  }): Promise<AutoTagsResult> {
    const res = await fetch('/api/gemini/auto-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Auto-tagging request failed with status ${res.status}`);
    }

    return res.json();
  }

  static async verifyVisualMatch(
    lostItem: Partial<Item>,
    foundItem: Partial<Item>
  ): Promise<VisualMatchResult> {
    const res = await fetch('/api/gemini/visual-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lostItem, foundItem }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Visual match verification failed with status ${res.status}`);
    }

    return res.json();
  }
}
