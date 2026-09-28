import { useState } from 'react';
import { User } from '../types';
import { BadgeService } from '../services/badgeService';
import { BadgePill } from './BadgePill';
import { 
  MapPin, 
  Award, 
  Star, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  RefreshCw,
  Trophy,
  Plus
} from 'lucide-react';

interface UserProfileCardProps {
  user: User;
  variant?: 'compact' | 'full';
  onOpenBadges: () => void;
  onRefreshLocation?: () => void;
  isLocating?: boolean;
  onSimulateReunion?: () => void;
  className?: string;
}

export function UserProfileCard({
  user,
  variant = 'compact',
  onOpenBadges,
  onRefreshLocation,
  isLocating = false,
  onSimulateReunion,
  className = ''
}: UserProfileCardProps) {
  const returnsCount = user.returnsCompleted || 0;
  const badges = BadgeService.getUserBadges(returnsCount);
  const highestBadge = BadgeService.getHighestBadge(returnsCount);
  const nextInfo = BadgeService.getNextBadge(returnsCount);

  // Compact variant: Ideal for Hamburger Menu Drawer
  if (variant === 'compact') {
    return (
      <div className={`p-3.5 bg-neutral-100 dark:bg-neutral-800/90 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3 ${className}`}>
        {/* User Identity Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-600 object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shrink-0">
                <span className="text-xs font-bold">{user.name.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {user.name}
                </span>
                {user.rating && (
                  <span className="flex items-center text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                    {user.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                <MapPin className={`w-3 h-3 text-rose-500 shrink-0 ${isLocating ? 'animate-pulse' : ''}`} />
                <span className="truncate max-w-[130px]">
                  {isLocating ? 'Detecting GPS...' : user.location.name}
                </span>
                {onRefreshLocation && (
                  <button
                    type="button"
                    onClick={onRefreshLocation}
                    disabled={isLocating}
                    className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-1"
                    title="Refresh your GPS location"
                  >
                    {isLocating ? '...' : 'GPS'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reunions stat badge */}
          <button
            type="button"
            onClick={onOpenBadges}
            className="flex flex-col items-end shrink-0 px-2 py-1 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-amber-400 dark:hover:border-amber-600 transition group cursor-pointer"
            title="Click to view all achievements"
          >
            <span className="text-[10px] font-semibold text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center gap-0.5">
              <Trophy className="w-2.5 h-2.5" />
              Reunions
            </span>
            <span className="text-xs font-black text-neutral-900 dark:text-white">
              {returnsCount}
            </span>
          </button>
        </div>

        {/* User Badges Row */}
        <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500" />
              Earned Badges ({badges.length})
            </span>
            <button
              type="button"
              onClick={onOpenBadges}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
            </button>
          </div>

          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 items-center">
              {badges.map(badge => (
                <BadgePill
                  key={badge.id}
                  badge={badge}
                  size="xs"
                  onClick={onOpenBadges}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 bg-white/60 dark:bg-neutral-900/60 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700/60">
              <span>Complete 1 reunion to unlock your first badge</span>
              <button
                type="button"
                onClick={onOpenBadges}
                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 underline cursor-pointer"
              >
                Learn More
              </button>
            </div>
          )}

          {/* Quick next milestone teaser */}
          {nextInfo.nextBadge && (
            <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400 pt-1">
              <span className="truncate">
                Next: <strong className="text-neutral-700 dark:text-neutral-300">{nextInfo.nextBadge.name}</strong> ({nextInfo.reunionsNeeded} more)
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                {nextInfo.progressPercent}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full Variant: For "My Reports" tab and dedicated Profile Card display
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 shadow-sm space-y-6 ${className}`}>
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-neutral-200 dark:border-neutral-700 shadow-sm"
            />
            {highestBadge && (
              <div 
                className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-white dark:bg-neutral-850 shadow-md border border-neutral-200 dark:border-neutral-700"
                title={`Highest Honor: ${highestBadge.name}`}
              >
                <BadgePill badge={highestBadge} size="xs" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white font-display">
                {user.name}
              </h2>
              {user.rating && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {user.rating.toFixed(1)} Community Rating
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
              <span>{user.email}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                {user.location.name}
              </span>
            </div>
          </div>
        </div>

        {/* Milestone Statistics Panel */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center sm:text-right">
            <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white font-display">
              {returnsCount}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Verified Reunions
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBadges}
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Badge Vault</span>
          </button>
        </div>
      </div>

      {/* Badges Showcase Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Achievement Honors & Badges
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              ({badges.length} Unlocked)
            </span>
          </div>

          {onSimulateReunion && (
            <button
              type="button"
              onClick={onSimulateReunion}
              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition"
              title="Add a test reunion to see badges unlock"
            >
              <Plus className="w-3 h-3" />
              <span>+1 Reunion (Simulate)</span>
            </button>
          )}
        </div>

        {badges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {badges.map(badge => (
              <div
                key={badge.id}
                onClick={onOpenBadges}
                className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850/80 border border-neutral-200 dark:border-neutral-750 hover:border-amber-400 dark:hover:border-amber-600 transition flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BadgePill badge={badge} size="sm" />
                </div>
                <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
                  {badge.tagline}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              No badges unlocked yet. Successfully reunite your first item to earn the <strong>Reunion Pioneer</strong> badge!
            </span>
            <button
              type="button"
              onClick={onOpenBadges}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer ml-3 shrink-0"
            >
              View Requirements
            </button>
          </div>
        )}

        {/* Milestone Progress Bar */}
        {nextInfo.nextBadge && (
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                Road to <strong className="text-neutral-900 dark:text-white">{nextInfo.nextBadge.name}</strong>:
              </span>
              <span className="text-neutral-500 font-mono text-[11px]">
                {returnsCount} / {nextInfo.nextBadge.minReunions} reunions ({nextInfo.reunionsNeeded} to go)
              </span>
            </div>

            <div className="w-full sm:w-48 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, nextInfo.progressPercent)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
