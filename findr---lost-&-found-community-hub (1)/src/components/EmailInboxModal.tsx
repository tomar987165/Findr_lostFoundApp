import { useState, useEffect } from 'react';
import { 
  X, Mail, Inbox, Sliders, CheckCircle2, Trash2, ExternalLink, 
  Sparkles, RefreshCw, Send, ShieldCheck, MapPin, ArrowRight 
} from 'lucide-react';
import { SentEmail, EmailPreferences, MockEmailService } from '../services/emailService';
import { User, Item } from '../types';

interface EmailInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onViewItem: (itemId: string) => void;
  allItems: Item[];
}

export function EmailInboxModal({
  isOpen,
  onClose,
  currentUser,
  onViewItem,
  allItems
}: EmailInboxModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'inbox' | 'preferences'>('inbox');
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [prefs, setPrefs] = useState<EmailPreferences>(() => 
    MockEmailService.getPreferences(currentUser)
  );
  const [prefsSaved, setPrefsSaved] = useState(false);

  const refreshEmails = () => {
    const list = MockEmailService.getSentEmails(currentUser.email);
    setEmails(list);
    if (list.length > 0 && !selectedEmail) {
      setSelectedEmail(list[0]);
    }
  };

  useEffect(() => {
    refreshEmails();
  }, [currentUser.id, currentUser.email]);

  const handleSelectEmail = (email: SentEmail) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      MockEmailService.markAsRead(email.id);
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    MockEmailService.savePreferences(currentUser.id, prefs);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  const handleSendTestAlert = () => {
    const lostItem = allItems.find(i => i.type === 'lost') || allItems[0];
    const foundItem = allItems.find(i => i.type === 'found') || allItems[1];

    if (lostItem && foundItem) {
      MockEmailService.dispatchProximityMatchAlert({
        recipient: currentUser,
        lostItem,
        foundItem,
        matchScore: 92,
        distanceKm: 0.3,
        reasons: [
          `Matching Category: ${lostItem.category.replace('_', ' ')}`,
          'Keywords: Proximity radius within 300 meters',
          'Timeline: Reported within discovery window'
        ],
      });
      refreshEmails();
    }
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col h-[85vh] transition-colors">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
                  Automated Email Alerts
                </h2>
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200/80 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                  Mock Dispatch Utility
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Inbox for <span className="font-semibold text-neutral-800 dark:text-neutral-200">{currentUser.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendTestAlert}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-800 transition cursor-pointer"
              title="Simulate sending a new proximity match alert"
            >
              <Send className="w-3 h-3" />
              <span>Send Test Alert</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-6 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'inbox'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Simulated Inbox ({emails.length})</span>
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'preferences'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Alert Preferences</span>
            </button>
          </div>

          <button
            onClick={refreshEmails}
            className="text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1 transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab 1: Inbox Viewer */}
        {activeTab === 'inbox' && (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left Email List */}
            <div className="w-full md:w-80 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto p-3 space-y-2 bg-neutral-50/50 dark:bg-neutral-950/40 shrink-0">
              {emails.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Mail className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">No emails dispatched yet</p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 max-w-xs mx-auto">
                    When someone reports an item within your proximity and description criteria, an automated email will appear here.
                  </p>
                  <button
                    onClick={handleSendTestAlert}
                    className="mt-2 px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition cursor-pointer"
                  >
                    Send Sample Alert
                  </button>
                </div>
              ) : (
                emails.map(email => (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      selectedEmail?.id === email.id
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-xs'
                        : !email.isRead
                        ? 'bg-white dark:bg-neutral-800/90 border-blue-200 dark:border-blue-800 font-semibold shadow-2xs'
                        : 'bg-white dark:bg-neutral-800/50 border-neutral-200/90 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 mb-1 font-mono">
                      <span className="truncate max-w-[130px] font-medium text-neutral-700 dark:text-neutral-300">{email.from}</span>
                      <span>{new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 leading-snug">
                      {email.subject}
                    </h4>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                      {email.snippet}
                    </p>

                    <div className="mt-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px]">
                      <span className="text-blue-700 dark:text-blue-400 font-bold">
                        {email.matchScore}% Match
                      </span>
                      <span className="text-neutral-400 dark:text-neutral-500">
                        {email.distanceKm <= 0.1 ? '100m' : `${email.distanceKm.toFixed(1)} km`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right Email Preview Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-neutral-900 text-left flex flex-col justify-between">
              {selectedEmail ? (
                <div className="space-y-4">
                  {/* Email Headers */}
                  <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3 space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-neutral-100 font-display">
                      {selectedEmail.subject}
                    </h3>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 font-mono">
                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500">From:</span> {selectedEmail.from}
                      </div>
                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500">To:</span> {selectedEmail.to} ({selectedEmail.toName})
                      </div>
                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500">Date:</span> {new Date(selectedEmail.sentAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Rendered HTML Email Content */}
                  <div
                    className="p-4 bg-neutral-50/50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-x-auto text-neutral-900 dark:text-neutral-100"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                  />

                  {/* Action to view item directly in Findr */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Automated alert triggered by Findr Proximity Engine
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onViewItem(selectedEmail.matchedItemId);
                      }}
                      className="px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Open Matched Item in Findr</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-neutral-400 dark:text-neutral-500 text-xs">
                  Select an email on the left to read its rendered contents.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Preferences */}
        {activeTab === 'preferences' && (
          <form onSubmit={handleSavePreferences} className="p-6 space-y-5 text-left max-w-lg mx-auto">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
                Automated Proximity Alert Preferences
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Customize when and how Findr sends automated email alerts for new matching items
              </p>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl">
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Email Notifications</span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Receive email alerts when potential matches are posted nearby
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.enabled}
                onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })}
                className="w-4 h-4 text-neutral-900 rounded focus:ring-neutral-900 cursor-pointer"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Notification Email Address
              </label>
              <input
                type="email"
                required
                value={prefs.emailAddress}
                onChange={(e) => setPrefs({ ...prefs, emailAddress: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>

            {/* Minimum Match Confidence */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Minimum Match Confidence Threshold
                </label>
                <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {prefs.minScoreThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={90}
                step={5}
                value={prefs.minScoreThreshold}
                onChange={(e) => setPrefs({ ...prefs, minScoreThreshold: Number(e.target.value) })}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-1">
                <span>30% (More alerts)</span>
                <span>60% (Balanced)</span>
                <span>90% (Strict matches only)</span>
              </div>
            </div>

            {/* Maximum Distance Radius */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Maximum Proximity Distance
                </label>
                <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {prefs.maxDistanceKm} km
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={prefs.maxDistanceKm}
                onChange={(e) => setPrefs({ ...prefs, maxDistanceKm: Number(e.target.value) })}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-1">
                <span>1 km (Immediate neighborhood)</span>
                <span>10 km</span>
                <span>30 km (Entire metro)</span>
              </div>
            </div>

            {/* Save */}
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
              {prefsSaved && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Preferences saved</span>
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
