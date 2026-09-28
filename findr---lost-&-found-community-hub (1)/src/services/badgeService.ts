import { UserBadge } from '../types';

export const BADGE_DEFINITIONS: UserBadge[] = [
  {
    id: 'badge_reunion_pioneer',
    name: 'Reunion Pioneer',
    minReunions: 1,
    tier: 'bronze',
    icon: 'Sparkles',
    tagline: '1st Verified Reunion',
    description: 'Completed your first verified item return or recovery on Findr.',
    perk: 'Verified Finder mark on report cards'
  },
  {
    id: 'badge_reliable_reporter',
    name: 'Reliable Reporter',
    minReunions: 2,
    tier: 'silver',
    icon: 'ShieldCheck',
    tagline: '2+ Verified Reunions',
    description: 'Established a consistent track record of honest reports and verified handovers.',
    perk: 'Priority verification queue and enhanced credibility trust marker'
  },
  {
    id: 'badge_good_samaritan',
    name: 'Good Samaritan',
    minReunions: 4,
    tier: 'gold',
    icon: 'HeartHandshake',
    tagline: '4+ Verified Reunions',
    description: 'Selfless campus citizen recognized for consistently helping neighbors recover lost possessions.',
    perk: 'Gold Trust Seal on chats and handover meeting requests'
  },
  {
    id: 'badge_community_hero',
    name: 'Community Hero',
    minReunions: 6,
    tier: 'platinum',
    icon: 'Trophy',
    tagline: '6+ Verified Reunions',
    description: 'Distinguished guardian of the community with 6+ successful item reunions.',
    perk: 'Highlighted Community Hero crest on all posted items and printable flyers'
  },
  {
    id: 'badge_legendary_guardian',
    name: 'Legendary Guardian',
    minReunions: 10,
    tier: 'diamond',
    icon: 'Crown',
    tagline: '10+ Verified Reunions',
    description: 'Elite milestone achieved through double-digit verified returns and retrievals.',
    perk: 'Hall of Fame recognition & permanent Diamond Crown accolade'
  }
];

export interface BadgeProgressItem extends UserBadge {
  unlocked: boolean;
  progress: number; // 0 to 100
  currentCount: number;
  reunionsNeeded: number;
}

export class BadgeService {
  /**
   * Returns list of all badges unlocked based on returnsCompleted count
   */
  static getUserBadges(returnsCompleted: number = 0): UserBadge[] {
    const count = Math.max(0, returnsCompleted);
    return BADGE_DEFINITIONS.filter(badge => count >= badge.minReunions);
  }

  /**
   * Returns the top/highest tier badge earned by the user
   */
  static getHighestBadge(returnsCompleted: number = 0): UserBadge | null {
    const badges = this.getUserBadges(returnsCompleted);
    if (badges.length === 0) return null;
    return badges[badges.length - 1];
  }

  /**
   * Returns next badge to unlock with progress information
   */
  static getNextBadge(returnsCompleted: number = 0): {
    nextBadge: UserBadge | null;
    reunionsNeeded: number;
    progressPercent: number;
  } {
    const count = Math.max(0, returnsCompleted);
    const nextBadge = BADGE_DEFINITIONS.find(b => count < b.minReunions) || null;

    if (!nextBadge) {
      return {
        nextBadge: null,
        reunionsNeeded: 0,
        progressPercent: 100
      };
    }

    // Previous milestone threshold
    const prevThreshold = BADGE_DEFINITIONS
      .filter(b => b.minReunions < nextBadge.minReunions)
      .reduce((max, b) => Math.max(max, b.minReunions), 0);

    const needed = nextBadge.minReunions - count;
    const progressRange = nextBadge.minReunions - prevThreshold;
    const currentProgress = count - prevThreshold;
    const progressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / progressRange) * 100)));

    return {
      nextBadge,
      reunionsNeeded: Math.max(0, needed),
      progressPercent
    };
  }

  /**
   * Returns all badges annotated with unlocked state and progress
   */
  static getAllBadgesWithProgress(returnsCompleted: number = 0): BadgeProgressItem[] {
    const count = Math.max(0, returnsCompleted);
    return BADGE_DEFINITIONS.map(badge => {
      const unlocked = count >= badge.minReunions;
      const progress = unlocked ? 100 : Math.min(99, Math.round((count / badge.minReunions) * 100));
      return {
        ...badge,
        unlocked,
        progress,
        currentCount: count,
        reunionsNeeded: Math.max(0, badge.minReunions - count)
      };
    });
  }

  /**
   * Check if crossing a new threshold unlocks a new badge
   */
  static checkNewlyUnlockedBadge(oldReunions: number, newReunions: number): UserBadge | null {
    const oldUnlocked = this.getUserBadges(oldReunions).map(b => b.id);
    const newUnlocked = this.getUserBadges(newReunions);
    const freshlyEarned = newUnlocked.filter(b => !oldUnlocked.includes(b.id));
    return freshlyEarned.length > 0 ? freshlyEarned[freshlyEarned.length - 1] : null;
  }
}
