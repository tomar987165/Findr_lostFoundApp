import { X, Sparkles, MapPin, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Item, User } from '../types';
import { formatDistance, calculateDistanceKm } from '../utils/geo';
import { InteractiveMap } from './InteractiveMap';

interface MatchComparisonModalProps {
  lostItem: Item;
  foundItem: Item;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onClaimItem: (item: Item) => void;
  onOpenChat: (item: Item) => void;
}

export function MatchComparisonModal({
  lostItem,
  foundItem,
  currentUser,
  isOpen,
  onClose,
  onClaimItem,
  onOpenChat
}: MatchComparisonModalProps) {
  if (!isOpen) return null;

  const distanceKm = calculateDistanceKm(lostItem.location, foundItem.location);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden max-h-[90vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
                Proximity Match Comparison
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Automated detection based on location coordinates, category, and descriptors
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {/* Proximity Score Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/90 dark:border-blue-800/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide">
                High Confidence Proximity Match
              </span>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                These items were reported <strong className="text-blue-950 dark:text-blue-100">{formatDistance(distanceKm)}</strong> apart in the same time window.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xl font-bold font-mono tabular-nums text-blue-900 dark:text-blue-200">
                  94%
                </div>
                <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                  Correlation
                </div>
              </div>
            </div>
          </div>

          {/* Side by Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Lost Item */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                  Lost Item Report
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                  {new Date(lostItem.date).toLocaleDateString()}
                </span>
              </div>

              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <img
                  src={lostItem.imageUrl}
                  alt={lostItem.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{lostItem.title}</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-3">{lostItem.description}</p>
              </div>

              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                <div className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>{lostItem.location.name}</span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Reported by: {lostItem.reporterName}
                </div>
              </div>
            </div>

            {/* Right Column: Found Item */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                  Found Item Report
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                  {new Date(foundItem.date).toLocaleDateString()}
                </span>
              </div>

              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <img
                  src={foundItem.imageUrl}
                  alt={foundItem.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{foundItem.title}</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-3">{foundItem.description}</p>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                <div className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>{foundItem.location.name}</span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Found by: {foundItem.reporterName}
                </div>
              </div>
            </div>
          </div>

          {/* Map view showing both pins */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
              Locations & Proximity Zone ({formatDistance(distanceKm)})
            </h4>
            <InteractiveMap
              center={[(lostItem.location.lat + foundItem.location.lat) / 2, (lostItem.location.lng + foundItem.location.lng) / 2]}
              zoom={15}
              items={[lostItem, foundItem]}
              heightClass="h-[200px]"
            />
          </div>

          {/* Verification Protection Notice */}
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <strong className="text-neutral-900 dark:text-neutral-100">Protected Ownership Handover:</strong> If this matches your lost item, click below to answer the finder's Ownership Challenge. Sensitive contact information remains concealed until verified.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0 flex items-center justify-between transition-colors">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onClaimItem(foundItem);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Claim This Item (Submit Evidence)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
