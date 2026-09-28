import { ShieldCheck, Award, Trophy, Sparkles, Crown, HeartHandshake, Medal } from 'lucide-react';
import { UserBadge, BadgeTier } from '../types';

interface BadgePillProps {
  badge: UserBadge;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  onClick?: () => void;
  className?: string;
  isUnlocked?: boolean;
}

export function getBadgeIcon(iconName: UserBadge['icon'], className: string = 'w-3.5 h-3.5') {
  switch (iconName) {
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'Medal':
    default:
      return <Medal className={className} />;
  }
}

export function getTierStyles(tier: BadgeTier, unlocked: boolean = true) {
  if (!unlocked) {
    return {
      bg: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 border-dashed border-neutral-300 dark:border-neutral-700',
      iconColor: 'text-neutral-400 dark:text-neutral-500',
      accent: 'border-neutral-300 dark:border-neutral-700',
      glow: ''
    };
  }

  switch (tier) {
    case 'bronze':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800/80',
        iconColor: 'text-amber-600 dark:text-amber-400',
        accent: 'border-amber-400/60',
        glow: 'shadow-xs shadow-amber-500/10'
      };
    case 'silver':
      return {
        bg: 'bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
        iconColor: 'text-blue-600 dark:text-blue-400',
        accent: 'border-slate-400/60',
        glow: 'shadow-xs shadow-slate-500/10'
      };
    case 'gold':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700/80',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        accent: 'border-yellow-400/80',
        glow: 'shadow-xs shadow-yellow-500/20'
      };
    case 'platinum':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800/80',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        accent: 'border-indigo-400/80',
        glow: 'shadow-xs shadow-indigo-500/20'
      };
    case 'diamond':
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-800/80',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        accent: 'border-cyan-400/80',
        glow: 'shadow-xs shadow-cyan-500/20'
      };
  }
}

export function BadgePill({
  badge,
  size = 'sm',
  showTagline = false,
  onClick,
  className = '',
  isUnlocked = true
}: BadgePillProps) {
  const styles = getTierStyles(badge.tier, isUnlocked);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-2',
    lg: 'px-3 py-1.5 text-sm gap-2.5'
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={`${badge.name}: ${badge.description}`}
      className={`inline-flex items-center font-semibold rounded-lg border transition-all select-none ${
        styles.bg
      } ${styles.glow} ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:scale-102 active:scale-98' : 'cursor-default'
      } ${className}`}
    >
      <span className={`${styles.iconColor} shrink-0`}>
        {getBadgeIcon(badge.icon, iconSizes)}
      </span>
      <span className="truncate tracking-tight font-display">{badge.name}</span>
      {showTagline && (
        <span className="text-[10px] opacity-75 font-normal border-l border-current/20 pl-1.5 ml-0.5 hidden sm:inline">
          {badge.tagline}
        </span>
      )}
    </button>
  );
}
