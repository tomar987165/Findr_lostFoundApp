import { X, Sparkles, ShieldCheck, CheckCheck, MapPin, ArrowRight, Bell } from 'lucide-react';
import { MatchAlert, User, Item } from '../types';
import { StorageService } from '../services/storage';

interface MatchNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  alerts: MatchAlert[];
  allItems: Item[];
  onSelectAlert: (alert: MatchAlert) => void;
  onMarkAllRead: () => void;
}

export function MatchNotificationsDrawer({
  isOpen,
  onClose,
  currentUser,
  alerts,
  allItems,
  onSelectAlert,
  onMarkAllRead
}: MatchNotificationsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-950/40 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 h-full shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">Notifications & Match Alerts</h2>
          </div>
          <div className="flex items-center gap-2">
            {alerts.some(a => !a.isRead) && (
              <button
                onClick={onMarkAllRead}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition cursor-pointer"
              >
                Mark read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/30 dark:bg-neutral-950/30">
          {alerts.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Sparkles className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">No active alerts</p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 max-w-xs mx-auto">
                When a lost or found item is reported near your location with matching attributes, you'll receive real-time notifications here.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const lostItem = allItems.find(i => i.id === alert.lostItemId);
              const foundItem = allItems.find(i => i.id === alert.foundItemId);

              return (
                <div
                  key={alert.id}
                  onClick={() => onSelectAlert(alert)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    !alert.isRead
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs'
                      : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{alert.matchScore}% Proximity Match</span>
                    </span>
                    <span className="text-neutral-400 dark:text-neutral-500 font-mono">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                    Potential match for "{alert.lostItemTitle}"
                  </h4>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-1">
                    Found item: "{alert.foundItemTitle}"
                  </p>

                  {alert.reasons.length > 0 && (
                    <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium space-y-0.5">
                      {alert.reasons.slice(0, 2).map((reason, idx) => (
                        <div key={idx} className="flex items-center gap-1 truncate">
                          <span className="w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0"></span>
                          <span className="truncate">{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                      {alert.distanceKm <= 0.1 ? '100m away' : `${alert.distanceKm.toFixed(1)} km away`}
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <span>Compare Items</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
