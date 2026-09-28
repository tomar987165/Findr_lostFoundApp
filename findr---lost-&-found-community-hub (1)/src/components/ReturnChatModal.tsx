import { useState, useEffect, useRef } from 'react';
import { X, Send, ShieldCheck, Shield, MapPin, CheckCircle, Clock, AlertTriangle, Building2, Coffee } from 'lucide-react';
import { Item, User, ChatMessage, ClaimVerification } from '../types';
import { StorageService } from '../services/storage';
import { SafetyTipsModal } from './SafetyTipsModal';

interface ReturnChatModalProps {
  item: Item;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: () => void;
}

export function ReturnChatModal({
  item,
  currentUser,
  isOpen,
  onClose,
  onItemUpdated
}: ReturnChatModalProps) {
  if (!isOpen) return null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeClaim, setActiveClaim] = useState<ClaimVerification | null>(null);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isReporter = item.reporterId === currentUser.id;
  const otherPartyName = isReporter ? 'Claimant / Owner' : item.reporterName;

  // Load messages and claim status
  const refreshChat = () => {
    const msgs = StorageService.getMessages(item.id);
    setMessages(msgs);

    const claims = StorageService.getClaims().filter(c => c.itemId === item.id);
    const approved = claims.find(c => c.status === 'approved');
    const pending = claims.find(c => c.status === 'pending');
    setActiveClaim(approved || pending || null);
  };

  useEffect(() => {
    refreshChat();
    const interval = setInterval(refreshChat, 2000);
    return () => clearInterval(interval);
  }, [item.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      itemId: item.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    StorageService.addMessage(newMsg);
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  const handleProposeMeeting = (locationName: string, time: string) => {
    const newMsg: ChatMessage = {
      id: `msg_meet_${Date.now()}`,
      itemId: item.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: `Proposed safe handover meeting at ${locationName} (${time}).`,
      timestamp: new Date().toISOString(),
      meetingProposal: {
        location: locationName,
        proposedTime: time,
        isAccepted: true
      }
    };

    StorageService.addMessage(newMsg);
    setMessages(prev => [...prev, newMsg]);
  };

  const handleMarkReunited = () => {
    if (confirm('Confirm item has been safely returned to rightful owner?')) {
      StorageService.markItemReunited(item.id);
      onItemUpdated();
      refreshChat();
    }
  };

  const isVerified = activeClaim?.status === 'approved' || item.status === 'reunited';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col h-[85vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 shrink-0">
          <div className="flex items-center gap-3">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
              />
            )}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[240px] sm:max-w-md">
                  {item.title}
                </h3>
                {isVerified ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Verified Safe
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Evidence Review
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Coordinating return between {item.reporterName} and claimant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSafetyTips(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 transition cursor-pointer"
              title="View Safe Handover Guidelines"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Safety Tips</span>
            </button>

            {item.status !== 'reunited' && isVerified && (
              <button
                onClick={handleMarkReunited}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Mark Reunited</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safety Protocol Banner */}
        <div className="px-5 py-2.5 bg-neutral-900 dark:bg-neutral-950 text-white text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white">Safety First:</strong> Meet only in public daylight zones (campus desk / police lobby) & avoid sharing private info.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowSafetyTips(true)}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 text-xs font-semibold rounded-md border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>View Safety Tips</span>
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-neutral-50/40 dark:bg-neutral-950/40">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 text-xs">
              No messages exchanged yet. Suggest a public handover spot below!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              if (msg.isSystemNotice) {
                return (
                  <div key={msg.id} className="p-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-600 dark:text-neutral-300 text-center mx-auto max-w-md">
                    {msg.text}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500 mb-1">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">{msg.senderName}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed text-left ${
                      isMe
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-br-xs'
                        : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/90 dark:border-neutral-700 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Proposal Card */}
                    {msg.meetingProposal && (
                      <div className={`mt-2 pt-2 border-t ${isMe ? 'border-white/20 dark:border-neutral-300' : 'border-neutral-200 dark:border-neutral-700'}`}>
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-500 dark:text-amber-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Handover Location: {msg.meetingProposal.location}</span>
                        </div>
                        <div className="text-[11px] mt-0.5 opacity-90">
                          Time: {msg.meetingProposal.proposedTime}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Location Suggestion Pills */}
        <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-neutral-400 dark:text-neutral-500 shrink-0 font-medium">Quick propose:</span>
          <button
            type="button"
            onClick={() => handleProposeMeeting('Central Library Front Desk', 'Today at 2:00 PM')}
            className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md font-medium shrink-0 flex items-center gap-1 transition cursor-pointer"
          >
            <Building2 className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
            <span>Library Front Desk (2 PM)</span>
          </button>
          <button
            type="button"
            onClick={() => handleProposeMeeting('Police Safe Exchange Zone', 'Tomorrow at 11:00 AM')}
            className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md font-medium shrink-0 flex items-center gap-1 transition cursor-pointer"
          >
            <ShieldCheck className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
            <span>Police Safe Exchange Zone</span>
          </button>
          <button
            type="button"
            onClick={() => handleProposeMeeting('Student Quad Coffee House', 'Today at 4:30 PM')}
            className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md font-medium shrink-0 flex items-center gap-1 transition cursor-pointer"
          >
            <Coffee className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
            <span>Campus Cafe (4:30 PM)</span>
          </button>
        </div>

        {/* Input Bar */}
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
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Coordinate safe return with ${otherPartyName}...`}
              className="flex-1 px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 rounded-xl text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Send</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>

      {/* Safety Tips Modal for Item Handover */}
      <SafetyTipsModal
        isOpen={showSafetyTips}
        onClose={() => setShowSafetyTips(false)}
      />
    </div>
  );
}
