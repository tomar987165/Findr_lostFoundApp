import { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Bot, User as UserIcon, Sparkles, Globe, MapPin, 
  ExternalLink, ShieldCheck, Zap, Brain, Compass, RefreshCw, AlertCircle 
} from 'lucide-react';
import { GeminiClient, ChatMessage, GroundingCitation, MapPlace } from '../services/geminiClient';
import { User } from '../types';

interface GeminiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

interface MessageEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  citations?: GroundingCitation[];
  places?: MapPlace[];
  timestamp: string;
}

const ROLES = [
  {
    id: 'detective',
    label: 'Lost & Found Detective',
    icon: '🕵️',
    description: 'Retrace steps, examine clues, and analyze timelines',
    systemInstruction:
      'You are a friendly Lost & Found Detective. Your mission is to help people find lost belongings by asking structured questions about where they were last seen, identifying high-probability locations (lockers, security desks, restrooms, transit stations), and suggesting precise descriptive keywords for public alerts.',
  },
  {
    id: 'verification',
    label: 'Ownership Challenge Architect',
    icon: '🛡️',
    description: 'Design tamper-proof verification questions',
    systemInstruction:
      'You are an Ownership Verification Specialist for Findr. Your job is to help people who have FOUND an item create clever, tamper-proof verification questions. The question must test details only the true owner would know (e.g. lockscreen photo details, unique scuff marks, engraving, internal contents) without revealing the answer in the public listing.',
  },
  {
    id: 'logistics',
    label: 'Safe Return & Safe Zones Advisor',
    icon: '📍',
    description: 'Guide secure handovers and public meeting zones',
    systemInstruction:
      'You are a Safe Return & Logistics Advisor. Advise users on conducting safe, daylight handovers at designated Safe Exchange Zones such as campus police stations, library information desks, and busy public transit kiosks. Never recommend meeting at private residences.',
  },
];

const MODELS = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    badge: 'General Tasks (Default)',
    icon: Sparkles,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Fast / Instant',
    icon: Zap,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    badge: 'Complex Tasks',
    icon: Brain,
  },
];

const PROMPT_SUGGESTIONS = [
  'How do I prove I own my lost iPhone if I lost the receipt?',
  'What verification question should I set for a found black wallet?',
  'Where are the safest exchange zones near university library?',
  'Steps to take immediately after losing house keys on transit',
];

export function GeminiChatbotModal({ isOpen, onClose, currentUser }: GeminiChatbotModalProps) {
  if (!isOpen) return null;

  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageEntry[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${currentUser.name}! I'm your Findr AI Assistant. Select a role above, toggle Google Search or Google Maps grounding, and ask me anything about lost items, evidence challenges, or safe return protocols.`,
      modelUsed: 'gemini-3.5-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    const userMsgId = `user_${Date.now()}`;
    const newMsg: MessageEntry = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Build conversation payload
      const chatHistory: ChatMessage[] = updatedMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      // Check grounding:
      // If useSearch is active, use gemini-3.5-flash with googleSearch tool
      // If useMaps is active, use gemini-3.5-flash with googleMaps tool
      const modelToUse = (useSearch || useMaps) ? 'gemini-3.5-flash' : selectedModel;

      const response = await GeminiClient.sendChat({
        messages: chatHistory,
        model: modelToUse,
        systemInstruction: selectedRole.systemInstruction,
        useSearch,
        useMaps,
        location: {
          lat: currentUser.location.lat,
          lng: currentUser.location.lng,
        },
      });

      // Extract web citations
      const citations: GroundingCitation[] = [];
      const places: MapPlace[] = [];

      if (response.groundingChunks) {
        response.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            citations.push({
              title: chunk.web.title || 'Web Source',
              uri: chunk.web.uri,
            });
          }
          if (chunk.maps?.uri) {
            places.push({
              title: chunk.maps.title || 'View Location on Google Maps',
              uri: chunk.maps.uri,
            });
          }
        });
      }

      const assistantMsg: MessageEntry = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response.text,
        modelUsed: response.model,
        citations: citations.length > 0 ? citations : undefined,
        places: places.length > 0 ? places : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err?.message || 'Failed to get answer from Gemini. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col h-[88vh] transition-colors">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 font-display">
                  Findr AI Assistant
                </h3>
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200/80 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                  Multi-turn Chat
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Grounding with Search, Maps & custom role personas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome_reset',
                    role: 'assistant',
                    content: 'Conversation history reset. How can I help you recover or verify your item today?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }}
              title="Reset conversation"
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Roles & Grounding Selector Bar */}
        <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          {/* Roles Selector */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium shrink-0">Role:</span>
            {ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                  selectedRole.id === role.id
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
                title={role.description}
              >
                <span>{role.icon}</span>
                <span>{role.label}</span>
              </button>
            ))}
          </div>

          {/* Model Selector & Grounding Toggles */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Model Select */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={useSearch || useMaps}
              className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 focus:outline-none cursor-pointer disabled:opacity-50"
              title={useSearch || useMaps ? 'Grounding uses gemini-3.5-flash' : 'Select Gemini Model'}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-neutral-800 dark:text-neutral-100">
                  {m.name} ({m.badge})
                </option>
              ))}
            </select>

            {/* Google Search Grounding Toggle */}
            <button
              onClick={() => {
                setUseSearch(!useSearch);
                if (!useSearch) setUseMaps(false);
              }}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border transition cursor-pointer ${
                useSearch
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
              title="Search Grounding using gemini-3.5-flash with googleSearch tool"
            >
              <Globe className="w-3 h-3" />
              <span>Google Search</span>
            </button>

            {/* Google Maps Grounding Toggle */}
            <button
              onClick={() => {
                setUseMaps(!useMaps);
                if (!useMaps) setUseSearch(false);
              }}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border transition cursor-pointer ${
                useMaps
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
              title="Maps Grounding using gemini-3.5-flash with googleMaps tool"
            >
              <MapPin className="w-3 h-3" />
              <span>Google Maps</span>
            </button>
          </div>
        </div>

        {/* Scrollable Chat History Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-neutral-50/40 dark:bg-neutral-950/40">
          {messages.map((msg) => {
            const isMe = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Meta info */}
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500 mb-1">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {isMe ? currentUser.name : selectedRole.label}
                  </span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">{msg.timestamp}</span>
                  {msg.modelUsed && (
                    <>
                      <span>·</span>
                      <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-1 py-0.2 rounded">
                        {msg.modelUsed}
                      </span>
                    </>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-xl px-4 py-3 rounded-2xl text-xs leading-relaxed text-left ${
                    isMe
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-br-xs'
                      : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/90 dark:border-neutral-700 rounded-bl-xs shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Google Search Citations / Web Links */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-700 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-[11px] text-blue-700 dark:text-blue-400">
                        <Globe className="w-3 h-3" />
                        <span>Google Search Grounding Sources:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((cite, idx) => (
                          <a
                            key={idx}
                            href={cite.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded text-[11px] font-medium border border-blue-200 dark:border-blue-800 truncate max-w-xs transition"
                          >
                            <span className="truncate">{cite.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Google Maps Place Links */}
                  {msg.places && msg.places.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-700 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-[11px] text-emerald-800 dark:text-emerald-300">
                        <MapPin className="w-3 h-3" />
                        <span>Google Maps Verified Places:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.places.map((place, idx) => (
                          <a
                            key={idx}
                            href={place.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded text-[11px] font-medium border border-emerald-200 dark:border-emerald-800 truncate max-w-xs transition"
                          >
                            <span className="truncate">{place.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse flex items-center justify-center">
                <Bot className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              </div>
              <div className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl rounded-bl-xs shadow-xs flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping"></span>
                <span>Thinking with {useSearch ? 'Google Search Grounding' : useMaps ? 'Google Maps Grounding' : selectedModel}...</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-neutral-400 dark:text-neutral-500 shrink-0 font-medium">Quick suggestions:</span>
          {PROMPT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s)}
              className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full shrink-0 transition cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask ${selectedRole.label} (e.g. search recovery steps, find safe police exchange zones)...`}
              className="flex-1 px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 rounded-xl text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
