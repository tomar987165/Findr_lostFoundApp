import { X, Award, CheckCircle2, Lock, Sparkles, Shield, ChevronRight, PlusCircle } from 'lucide-react';
import { User } from '../types';
import { BadgeService, BadgeProgressItem } from '../services/badgeService';
import { getBadgeIcon, getTierStyles } from './BadgePill';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSimulateReunion?: () => void;
}

export function BadgesModal({
  isOpen,
  onClose,
  user,
  onSimulateReunion
}: BadgesModalProps) {
  if (!isOpen) return null;

  const returnsCount = user.returnsCompleted || 0;
  const badgesWithProgress: BadgeProgressItem[] = BadgeService.getAllBadgesWithProgress(returnsCount);
  const highestBadge = BadgeService.getHighestBadge(returnsCount);
  const nextInfo = BadgeService.getNextBadge(returnsCount);

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-6 flex flex-col transition-colors animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="badges-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-850/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 id="badges-modal-title" className="text-base font-bold text-neutral-900 dark:text-white font-display">
                Community Achievements & Badges
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Honor system rewarding verified returns and trustworthy reporting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* User Achievement Showcase Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-850 dark:to-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border-2 border-white dark:border-neutral-700 shadow-xs object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">{user.name}</span>
                    {highestBadge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        {highestBadge.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {user.location.name} · {returnsCount} {returnsCount === 1 ? 'Reunion' : 'Reunions'} Completed
                  </p>
                </div>
              </div>

              {/* Stat highlight */}
              <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="text-center sm:text-right">
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                    {returnsCount}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Handover Milestones
                  </div>
                </div>
              </div>
            </div>

            {/* Next badge milestone progress */}
            {nextInfo.nextBadge ? (
              <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Next Target: <strong className="text-neutral-900 dark:text-white">{nextInfo.nextBadge.name}</strong>
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                    {nextInfo.reunionsNeeded} more {nextInfo.reunionsNeeded === 1 ? 'reunion' : 'reunions'} required
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(5, nextInfo.progressPercent)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-700/60 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Supreme Achievement Unlocked: Maximum Badge Level Achieved!</span>
              </div>
            )}
          </div>

          {/* Badges List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Badge Tiers & Requirements
            </h3>

            <div className="space-y-2.5">
              {badgesWithProgress.map(badge => {
                const styles = getTierStyles(badge.tier, badge.unlocked);
                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      badge.unlocked
                        ? 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-750 shadow-xs'
                        : 'bg-neutral-50/50 dark:bg-neutral-850/30 border-dashed border-neutral-200 dark:border-neutral-800 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                            styles.bg
                          }`}
                        >
                          <span className={styles.iconColor}>
                            {getBadgeIcon(badge.icon, 'w-5 h-5')}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-neutral-900 dark:text-white font-display">
                              {badge.name}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${styles.bg}`}>
                              {badge.tagline}
                            </span>
                            {badge.unlocked && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                Unlocked
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                            {badge.description}
                          </p>

                          <div className="pt-1 flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                            <Shield className="w-3 h-3 text-neutral-400" />
                            <span><strong>Perk:</strong> {badge.perk}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {badge.unlocked ? (
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Earned
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
                            <Lock className="w-3 h-3" />
                            <span className="text-[11px] font-medium">{badge.reunionsNeeded} left</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Safe community trust benefits */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/40 space-y-2">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              How Badges Help You in the Community
            </h4>
            <p className="text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
              Earned badges like <strong>Reliable Reporter</strong> and <strong>Community Hero</strong> are prominently displayed across your posts, claim responses, and return chats. They reassure campus community members that you are a verified, honest participant, significantly accelerating handovers and evidence reviews.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-850/80 flex items-center justify-between shrink-0">
          {onSimulateReunion ? (
            <button
              type="button"
              onClick={onSimulateReunion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Simulate Successful Reunion (+1)</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
