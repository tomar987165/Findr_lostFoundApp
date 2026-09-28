import { useState } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  MapPin,
  Lock,
  Sun,
  Users,
  Eye,
  DollarSign,
  PhoneCall,
  CheckCircle2,
  Building,
  AlertTriangle
} from 'lucide-react';

interface SafetyTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SafetyTipsModal({ isOpen, onClose }: SafetyTipsModalProps) {
  if (!isOpen) return null;

  const [checklist, setChecklist] = useState({
    publicPlace: false,
    noPersonalInfo: false,
    daylightHours: false,
    buddySystem: false,
    verifyDevice: false,
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="safety-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-900 dark:bg-neutral-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 id="safety-modal-title" className="text-base font-bold font-display text-white">
                Safe Item Handover Guidelines
              </h2>
              <p className="text-xs text-neutral-400">
                Protocols for safe, secure, and stress-free reunions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close safety tips"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left text-neutral-800 dark:text-neutral-200">
          {/* Key Rule Warning Banner */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong className="font-semibold block text-amber-950 dark:text-amber-100 mb-0.5">
                Golden Rule of Item Returns
              </strong>
              Always prioritize personal safety over recovering any physical item. Never agree to private visits, secluded parking lots, or remote areas under any circumstance.
            </div>
          </div>

          {/* Core Safety Guidelines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Public Meeting Locations */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/80 rounded-xl space-y-2 hover:border-neutral-300 dark:hover:border-neutral-600 transition">
              <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>1. Choose Safe Public Zones</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Meet at official designated Safe Exchange Zones:
              </p>
              <ul className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1 list-disc list-inside">
                <li>Campus Information or Security Desks</li>
                <li>Police Department precinct lobbies</li>
                <li>High-foot-traffic student union dining areas</li>
                <li>Busy coffee shops during peak hours</li>
              </ul>
              <div className="text-[11px] text-red-600 dark:text-red-400 font-medium pt-1">
                ✕ Avoid: Private residences, dorm rooms, or parking garages.
              </div>
            </div>

            {/* 2. Privacy & Personal Info */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/80 rounded-xl space-y-2 hover:border-neutral-300 dark:hover:border-neutral-600 transition">
              <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                  <Lock className="w-4 h-4" />
                </div>
                <span>2. Protect Personal Info</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Keep communications contained within Findr until verification is complete:
              </p>
              <ul className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1 list-disc list-inside">
                <li>Never share home address or dorm room numbers</li>
                <li>Do not disclose banking or financial details</li>
                <li>Keep personal phone number private if uncomfortable</li>
                <li>Do not share passwords, PINs, or ID numbers</li>
              </ul>
            </div>

            {/* 3. Daylight & Timing */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/80 rounded-xl space-y-2 hover:border-neutral-300 dark:hover:border-neutral-600 transition">
              <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  <Sun className="w-4 h-4" />
                </div>
                <span>3. Meet in Broad Daylight</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Coordinate handovers during active daylight hours (recommended 10:00 AM – 4:00 PM) when campus and public buildings are fully staffed.
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Reschedule if the other party insists on meeting late at night or in the dark.
              </p>
            </div>

            {/* 4. Buddy System */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/80 rounded-xl space-y-2 hover:border-neutral-300 dark:hover:border-neutral-600 transition">
              <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  <Users className="w-4 h-4" />
                </div>
                <span>4. Use the Buddy System</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Bring a friend, roommate, or colleague with you to the meeting.
              </p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Before heading out, inform someone you trust of where you are going, who you are meeting, and when you expect to return.
              </p>
            </div>

            {/* 5. In-Person Verification */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/80 rounded-xl space-y-2 hover:border-neutral-300 dark:hover:border-neutral-600 transition">
              <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                  <Eye className="w-4 h-4" />
                </div>
                <span>5. Verify Before Release</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Confirm ownership directly upon meeting:
              </p>
              <ul className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1 list-disc list-inside">
                <li>Phones/Laptops: Have claimant unlock device on the spot</li>
                <li>Wallets: Verify photo ID matches the name on cards</li>
                <li>Keys: Verify matching vehicle or specific key tags</li>
              </ul>
            </div>

            {/* 6. No Advance Payment or Wire */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/80 rounded-xl space-y-2 hover:border-neutral-300 dark:hover:border-neutral-600 transition">
              <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span>6. Never Wire Money for Shipping</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Beware of courier or shipping fee scams:
              </p>
              <ul className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1 list-disc list-inside">
                <li>Never send Zelle, Venmo, or wire transfers in advance</li>
                <li>Reject requests for gift cards or insurance deposits</li>
                <li>Legitimate returns take place in person or via verified campus lost & found</li>
              </ul>
            </div>
          </div>

          {/* Interactive Pre-Handover Checklist */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Pre-Handover Safety Checklist</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                {Object.values(checklist).filter(Boolean).length} / 5 Checked
              </span>
            </div>

            <div className="space-y-2">
              <label 
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-50/50 dark:hover:bg-neutral-750 cursor-pointer transition text-xs text-neutral-800 dark:text-neutral-200"
              >
                <input
                  type="checkbox"
                  checked={checklist.publicPlace}
                  onChange={() => toggleCheck('publicPlace')}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 dark:border-neutral-600"
                />
                <span>We agreed to meet at a busy, public location (e.g. library lobby, police station)</span>
              </label>

              <label 
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-50/50 dark:hover:bg-neutral-750 cursor-pointer transition text-xs text-neutral-800 dark:text-neutral-200"
              >
                <input
                  type="checkbox"
                  checked={checklist.noPersonalInfo}
                  onChange={() => toggleCheck('noPersonalInfo')}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 dark:border-neutral-600"
                />
                <span>I did not share my home address, dorm room, or private financial details</span>
              </label>

              <label 
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-50/50 dark:hover:bg-neutral-750 cursor-pointer transition text-xs text-neutral-800 dark:text-neutral-200"
              >
                <input
                  type="checkbox"
                  checked={checklist.daylightHours}
                  onChange={() => toggleCheck('daylightHours')}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 dark:border-neutral-600"
                />
                <span>The meeting is scheduled during daytime hours with good lighting</span>
              </label>

              <label 
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-50/50 dark:hover:bg-neutral-750 cursor-pointer transition text-xs text-neutral-800 dark:text-neutral-200"
              >
                <input
                  type="checkbox"
                  checked={checklist.buddySystem}
                  onChange={() => toggleCheck('buddySystem')}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 dark:border-neutral-600"
                />
                <span>I am bringing a companion or have notified a friend about this meeting</span>
              </label>

              <label 
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-50/50 dark:hover:bg-neutral-750 cursor-pointer transition text-xs text-neutral-800 dark:text-neutral-200"
              >
                <input
                  type="checkbox"
                  checked={checklist.verifyDevice}
                  onChange={() => toggleCheck('verifyDevice')}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 dark:border-neutral-600"
                />
                <span>I will verify ownership on the spot (device unlock or matching photo ID)</span>
              </label>
            </div>
          </div>

          {/* Emergency Assistance Notice */}
          <div className="p-3.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span>Feel unsafe? Leave immediately and contact local emergency services.</span>
            </div>
            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700">
              Dial 911 / Campus Police
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0 flex items-center justify-between transition-colors">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
            {allChecked ? '✓ All safety items checked!' : 'Review guidelines before confirming meeting.'}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>I Understand Safe Handover Rules</span>
          </button>
        </div>
      </div>
    </div>
  );
}
