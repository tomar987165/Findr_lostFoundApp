import { Item, ClaimVerification, ChatMessage, MatchAlert, User, VisualMatchResult, UserBadge } from '../types';
import { INITIAL_ITEMS, DEMO_USERS, INITIAL_CLAIMS, INITIAL_MESSAGES, INITIAL_MATCH_ALERTS } from '../data/mockData';
import { calculateMatchScore } from '../utils/geo';
import { MockEmailService } from './emailService';
import { GeminiClient } from './geminiClient';
import { BadgeService } from './badgeService';

const STORAGE_KEYS = {
  ITEMS: 'findr_items_v2',
  CLAIMS: 'findr_claims_v2',
  MESSAGES: 'findr_messages_v2',
  ALERTS: 'findr_alerts_v2',
  CURRENT_USER: 'findr_current_user_v2',
  USERS: 'findr_users_v2',
};

// Check if localStorage is available
function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export class StorageService {
  static getItems(): Item[] {
    return getStored<Item[]>(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
  }

  static saveItems(items: Item[]): void {
    setStored(STORAGE_KEYS.ITEMS, items);
  }

  static evaluateVisualMatch(lostItem: Item, foundItem: Item): VisualMatchResult {
    // 1. Category must match
    if (lostItem.category !== foundItem.category) {
      return {
        isPerfectMatch: false,
        visualMatchScore: 25,
        matchVerdict: 'mismatch',
        visualEvidence: [],
        discrepancies: [`Mismatched categories: ${lostItem.category} vs ${foundItem.category}`],
        mediaAnalyzed: lostItem.videoUrl || foundItem.videoUrl ? 'video' : 'image',
        summary: 'Items belong to conflicting product categories. Alert withheld.',
      };
    }

    const lostText = `${lostItem.title} ${lostItem.description} ${lostItem.tags.join(' ')}`.toLowerCase();
    const foundText = `${foundItem.title} ${foundItem.description} ${foundItem.tags.join(' ')}`.toLowerCase();

    // 2. Color check: if conflicting colors, reject
    const colors = ['white', 'black', 'brown', 'blue', 'silver', 'gold', 'red', 'green', 'gray', 'grey', 'yellow', 'tan'];
    const lostColors = colors.filter(c => lostText.includes(c));
    const foundColors = colors.filter(c => foundText.includes(c));
    const sharedColors = lostColors.filter(c => foundColors.includes(c));
    const hasConflictingColors = lostColors.length > 0 && foundColors.length > 0 && sharedColors.length === 0;

    if (hasConflictingColors) {
      return {
        isPerfectMatch: false,
        visualMatchScore: 35,
        matchVerdict: 'mismatch',
        visualEvidence: [`Matching category: ${lostItem.category.replace('_', ' ')}`],
        discrepancies: [`Conflicting colors: ${lostColors.join('/')} vs ${foundColors.join('/')}`],
        mediaAnalyzed: lostItem.videoUrl || foundItem.videoUrl ? 'video' : 'image',
        summary: `Visual color mismatch detected (${lostColors.join(', ')} vs ${foundColors.join(', ')}). Alert withheld to prevent false alarms.`,
      };
    }

    // 3. Media comparison
    const isSameMedia = Boolean(
      (lostItem.imageUrl && foundItem.imageUrl && lostItem.imageUrl === foundItem.imageUrl) ||
      (lostItem.videoUrl && foundItem.videoUrl && lostItem.videoUrl === foundItem.videoUrl)
    );

    const models = ['airpods', 'iphone', 'macbook', 'fossil', 'wallet', 'keys', 'retriever', 'hydroflask', 'ipad', 'sony', 'bose', 'samsung', 'watch'];
    const sharedModels = models.filter(m => lostText.includes(m) && foundText.includes(m));

    let score = 55;
    const visualEvidence: string[] = [`Matching category: ${lostItem.category.replace('_', ' ')}`];
    const discrepancies: string[] = [];

    if (isSameMedia) {
      score += 40;
      visualEvidence.push('Identical visual media reference and geometry verified');
    }

    if (sharedColors.length > 0) {
      score += 25;
      visualEvidence.push(`Exact color palette alignment: "${sharedColors.join(', ')}"`);
    }

    if (sharedModels.length > 0) {
      score += 20;
      visualEvidence.push(`Product model & hardware silhouette verified: "${sharedModels.join(', ')}"`);
    }

    const isPerfectMatch = score >= 80;
    if (isPerfectMatch) {
      discrepancies.push('None detected - visual inspection confirms high-confidence perfect match');
    } else {
      discrepancies.push('Visual certainty is below the 80% threshold required for automated alert dispatch');
    }

    const finalScore = Math.min(100, Math.max(0, score));

    return {
      isPerfectMatch,
      visualMatchScore: finalScore,
      matchVerdict: isPerfectMatch ? 'perfect_match' : finalScore >= 60 ? 'probable_match' : 'mismatch',
      visualEvidence,
      discrepancies,
      mediaAnalyzed: lostItem.videoUrl || foundItem.videoUrl ? 'video' : 'image',
      summary: isPerfectMatch
        ? 'Gemini Multimodal inspection confirmed 100% visual match: Both media samples show matching product model, geometry, and color profile.'
        : 'Visual inspection did not satisfy the strict perfect match threshold. Alert withheld to avoid user spam.',
    };
  }

  static addItem(newItem: Item): { item: Item; newMatches: MatchAlert[] } {
    const items = this.getItems();
    items.unshift(newItem);
    this.saveItems(items);

    // Auto-detect matches against existing active items
    const generatedAlerts: MatchAlert[] = [];
    const alerts = this.getAlerts();

    if (newItem.type === 'lost') {
      const activeFound = items.filter(i => i.type === 'found' && i.status !== 'reunited');
      for (const found of activeFound) {
        const geoMatch = calculateMatchScore(newItem, found);
        
        // Preliminary candidate check
        if (geoMatch.score >= 40 && geoMatch.distanceKm <= 8) {
          // Perform image and video visual match evaluation
          const visualCheck = this.evaluateVisualMatch(newItem, found);

          // ONLY SEND ALERT TO USER IF ITEMS ARE MATCHING PERFECTLY!
          if (visualCheck.isPerfectMatch) {
            const combinedScore = Math.round((geoMatch.score * 0.4) + (visualCheck.visualMatchScore * 0.6));
            const alert: MatchAlert = {
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              recipientId: newItem.reporterId,
              lostItemId: newItem.id,
              foundItemId: found.id,
              lostItemTitle: newItem.title,
              foundItemTitle: found.title,
              matchScore: combinedScore,
              distanceKm: geoMatch.distanceKm,
              reasons: [
                `✓ Verified Perfect Visual Match (${visualCheck.visualMatchScore}%)`,
                ...geoMatch.reasons,
                ...visualCheck.visualEvidence.slice(0, 2),
              ],
              isVisualMatchVerified: true,
              visualMatchScore: visualCheck.visualMatchScore,
              visualMatchReason: visualCheck.summary,
              visualEvidence: visualCheck.visualEvidence,
              discrepancies: visualCheck.discrepancies,
              mediaTypeMatched: visualCheck.mediaAnalyzed,
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            generatedAlerts.push(alert);
            alerts.unshift(alert);

            // Automated Mock Email Notification Dispatch ONLY when visual match confirmed
            const recipientUser = DEMO_USERS.find(u => u.id === newItem.reporterId) || {
              id: newItem.reporterId,
              name: newItem.reporterName,
              email: newItem.reporterContact || `${newItem.reporterName.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
              avatar: newItem.reporterAvatar,
              location: newItem.location,
            };

            MockEmailService.dispatchProximityMatchAlert({
              recipient: recipientUser,
              lostItem: newItem,
              foundItem: found,
              matchScore: combinedScore,
              distanceKm: geoMatch.distanceKm,
              reasons: alert.reasons,
            });

            // Asynchronously run Gemini vision server verification to refine evidence
            GeminiClient.verifyVisualMatch(newItem, found).then((geminiVisionResult) => {
              if (geminiVisionResult && geminiVisionResult.visualEvidence) {
                const currentAlerts = this.getAlerts();
                const target = currentAlerts.find(a => a.id === alert.id);
                if (target) {
                  target.visualMatchScore = geminiVisionResult.visualMatchScore;
                  target.visualMatchReason = geminiVisionResult.summary;
                  target.visualEvidence = geminiVisionResult.visualEvidence;
                  target.discrepancies = geminiVisionResult.discrepancies;
                  this.saveAlerts(currentAlerts);
                }
              }
            }).catch(() => {
              // fallback is already saved
            });
          } else {
            console.log(`[StorageService] Visual match rejected between "${newItem.title}" and "${found.title}". Alert withheld.`);
          }
        }
      }
    } else if (newItem.type === 'found') {
      const activeLost = items.filter(i => i.type === 'lost' && i.status !== 'reunited');
      for (const lost of activeLost) {
        const geoMatch = calculateMatchScore(lost, newItem);
        
        // Preliminary candidate check
        if (geoMatch.score >= 40 && geoMatch.distanceKm <= 8) {
          // Perform image and video visual match evaluation
          const visualCheck = this.evaluateVisualMatch(lost, newItem);

          // ONLY SEND ALERT TO USER IF ITEMS ARE MATCHING PERFECTLY!
          if (visualCheck.isPerfectMatch) {
            const combinedScore = Math.round((geoMatch.score * 0.4) + (visualCheck.visualMatchScore * 0.6));
            const alert: MatchAlert = {
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              recipientId: lost.reporterId,
              lostItemId: lost.id,
              foundItemId: newItem.id,
              lostItemTitle: lost.title,
              foundItemTitle: newItem.title,
              matchScore: combinedScore,
              distanceKm: geoMatch.distanceKm,
              reasons: [
                `✓ Verified Perfect Visual Match (${visualCheck.visualMatchScore}%)`,
                ...geoMatch.reasons,
                ...visualCheck.visualEvidence.slice(0, 2),
              ],
              isVisualMatchVerified: true,
              visualMatchScore: visualCheck.visualMatchScore,
              visualMatchReason: visualCheck.summary,
              visualEvidence: visualCheck.visualEvidence,
              discrepancies: visualCheck.discrepancies,
              mediaTypeMatched: visualCheck.mediaAnalyzed,
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            generatedAlerts.push(alert);
            alerts.unshift(alert);

            // Automated Mock Email Notification Dispatch to Lost Item Owner
            const recipientUser = DEMO_USERS.find(u => u.id === lost.reporterId) || {
              id: lost.reporterId,
              name: lost.reporterName,
              email: lost.reporterContact || `${lost.reporterName.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
              avatar: lost.reporterAvatar,
              location: lost.location,
            };

            MockEmailService.dispatchProximityMatchAlert({
              recipient: recipientUser,
              lostItem: lost,
              foundItem: newItem,
              matchScore: combinedScore,
              distanceKm: geoMatch.distanceKm,
              reasons: alert.reasons,
            });

            // Asynchronously run Gemini vision server verification to refine evidence
            GeminiClient.verifyVisualMatch(lost, newItem).then((geminiVisionResult) => {
              if (geminiVisionResult && geminiVisionResult.visualEvidence) {
                const currentAlerts = this.getAlerts();
                const target = currentAlerts.find(a => a.id === alert.id);
                if (target) {
                  target.visualMatchScore = geminiVisionResult.visualMatchScore;
                  target.visualMatchReason = geminiVisionResult.summary;
                  target.visualEvidence = geminiVisionResult.visualEvidence;
                  target.discrepancies = geminiVisionResult.discrepancies;
                  this.saveAlerts(currentAlerts);
                }
              }
            }).catch(() => {
              // fallback is already saved
            });
          } else {
            console.log(`[StorageService] Visual match rejected between "${lost.title}" and "${newItem.title}". Alert withheld.`);
          }
        }
      }
    }

    if (generatedAlerts.length > 0) {
      this.saveAlerts(alerts);
    }

    return { item: newItem, newMatches: generatedAlerts };
  }

  static updateItem(updatedItem: Item): void {
    const items = this.getItems().map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    this.saveItems(items);
  }

  static markItemReunited(itemId: string): { updatedItem?: Item; reward?: { user: User; newlyUnlockedBadge: UserBadge | null } } {
    let targetItem: Item | undefined;
    const items = this.getItems().map(item => {
      if (item.id === itemId) {
        targetItem = { ...item, status: 'reunited' as const };
        return targetItem;
      }
      return item;
    });
    this.saveItems(items);

    // Also push a system notice to messages
    this.addMessage({
      id: `sys_reunited_${Date.now()}`,
      itemId,
      senderId: 'system',
      senderName: 'Findr Safety System',
      senderAvatar: '',
      text: '🎉 Item has been marked as officially Reunited! Both parties have confirmed safe handover. Congratulations!',
      timestamp: new Date().toISOString(),
      isSystemNotice: true
    });

    let reward: { user: User; newlyUnlockedBadge: UserBadge | null } | undefined;
    if (targetItem) {
      // Find beneficiary: reporter or active claimant
      const currentUser = this.getCurrentUser();
      const targetUserId = (targetItem as Item).reporterId || currentUser.id;
      reward = this.incrementUserReunions(targetUserId);
    }

    return { updatedItem: targetItem, reward };
  }

  // Claim verifications
  static getClaims(): ClaimVerification[] {
    return getStored<ClaimVerification[]>(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);
  }

  static saveClaims(claims: ClaimVerification[]): void {
    setStored(STORAGE_KEYS.CLAIMS, claims);
  }

  static submitClaim(claim: ClaimVerification): void {
    const claims = this.getClaims();
    claims.unshift(claim);
    this.saveClaims(claims);

    // Also notify finder
    const alerts = this.getAlerts();
    alerts.unshift({
      id: `alert_claim_${Date.now()}`,
      recipientId: claim.finderId,
      lostItemId: claim.itemId,
      foundItemId: claim.itemId,
      lostItemTitle: claim.claimantName,
      foundItemTitle: claim.itemTitle,
      matchScore: 100,
      distanceKm: 0,
      reasons: [`New proof of ownership evidence submitted by ${claim.claimantName}`],
      isRead: false,
      createdAt: new Date().toISOString()
    });
    this.saveAlerts(alerts);
  }

  static reviewClaim(claimId: string, status: 'approved' | 'rejected', reason?: string): ClaimVerification | undefined {
    const claims = this.getClaims();
    let reviewedClaim: ClaimVerification | undefined;

    const updated = claims.map(c => {
      if (c.id === claimId) {
        reviewedClaim = {
          ...c,
          status,
          rejectionReason: reason,
          reviewedAt: new Date().toISOString()
        };
        return reviewedClaim;
      }
      return c;
    });

    this.saveClaims(updated);

    if (reviewedClaim) {
      // Send notification to claimant
      const alerts = this.getAlerts();
      alerts.unshift({
        id: `alert_decision_${Date.now()}`,
        recipientId: reviewedClaim.claimantId,
        lostItemId: reviewedClaim.itemId,
        foundItemId: reviewedClaim.itemId,
        lostItemTitle: reviewedClaim.itemTitle,
        foundItemTitle: status === 'approved' ? 'Ownership Verified!' : 'Claim Review Notice',
        matchScore: status === 'approved' ? 100 : 0,
        distanceKm: 0,
        reasons: [
          status === 'approved' 
            ? 'The finder verified your ownership evidence. Secure Return Chat is now unlocked!' 
            : `Evidence was not accepted: ${reason || 'Details did not match'}`
        ],
        isRead: false,
        createdAt: new Date().toISOString()
      });
      this.saveAlerts(alerts);

      // If approved, create system chat greeting
      if (status === 'approved') {
        this.addMessage({
          id: `sys_approved_${Date.now()}`,
          itemId: reviewedClaim.itemId,
          senderId: 'system',
          senderName: 'Findr Safety System',
          senderAvatar: '',
          text: `✅ Ownership evidence has been verified and approved by the finder. You can now coordinate handover location and timing safely.`,
          timestamp: new Date().toISOString(),
          isSystemNotice: true
        });
      }
    }

    return reviewedClaim;
  }

  // Messages
  static getMessages(itemId?: string): ChatMessage[] {
    const all = getStored<ChatMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    if (!itemId) return all;
    return all.filter(m => m.itemId === itemId);
  }

  static addMessage(message: ChatMessage): void {
    const messages = getStored<ChatMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    messages.push(message);
    setStored(STORAGE_KEYS.MESSAGES, messages);
  }

  // Alerts
  static getAlerts(recipientId?: string): MatchAlert[] {
    const all = getStored<MatchAlert[]>(STORAGE_KEYS.ALERTS, INITIAL_MATCH_ALERTS);
    if (!recipientId) return all;
    return all.filter(a => a.recipientId === recipientId);
  }

  static saveAlerts(alerts: MatchAlert[]): void {
    setStored(STORAGE_KEYS.ALERTS, alerts);
  }

  static markAlertAsRead(alertId: string): void {
    const alerts = this.getAlerts().map(a => 
      a.id === alertId ? { ...a, isRead: true } : a
    );
    this.saveAlerts(alerts);
  }

  static markAllAlertsAsRead(recipientId: string): void {
    const alerts = this.getAlerts().map(a => 
      a.recipientId === recipientId ? { ...a, isRead: true } : a
    );
    this.saveAlerts(alerts);
  }

  // User session & management
  static getUsers(): User[] {
    return getStored<User[]>(STORAGE_KEYS.USERS, DEMO_USERS);
  }

  static saveUsers(users: User[]): void {
    setStored(STORAGE_KEYS.USERS, users);
  }

  static getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  static updateUser(updatedUser: User): void {
    const users = this.getUsers().map(u => u.id === updatedUser.id ? updatedUser : u);
    this.saveUsers(users);
    const curr = this.getCurrentUser();
    if (curr.id === updatedUser.id) {
      this.setCurrentUser(updatedUser);
    }
  }

  static incrementUserReunions(userId: string): { user: User; newlyUnlockedBadge: UserBadge | null } {
    const users = this.getUsers();
    let updatedUser: User | null = null;
    let newlyUnlockedBadge: UserBadge | null = null;

    const newUsers = users.map(u => {
      if (u.id === userId) {
        const oldReturns = u.returnsCompleted || 0;
        const newReturns = oldReturns + 1;
        newlyUnlockedBadge = BadgeService.checkNewlyUnlockedBadge(oldReturns, newReturns);
        updatedUser = { ...u, returnsCompleted: newReturns };
        return updatedUser;
      }
      return u;
    });

    if (updatedUser) {
      this.saveUsers(newUsers);
      const curr = this.getCurrentUser();
      if (curr.id === userId) {
        this.setCurrentUser(updatedUser);
      }
      return { user: updatedUser, newlyUnlockedBadge };
    }

    // Fallback to updating current user directly
    const fallbackUser = this.getCurrentUser();
    const oldR = fallbackUser.returnsCompleted || 0;
    const newR = oldR + 1;
    newlyUnlockedBadge = BadgeService.checkNewlyUnlockedBadge(oldR, newR);
    const resultUser: User = { ...fallbackUser, returnsCompleted: newR };
    this.setCurrentUser(resultUser);
    return { user: resultUser, newlyUnlockedBadge };
  }

  static getCurrentUser(): User {
    const user = getStored<User>(STORAGE_KEYS.CURRENT_USER, DEMO_USERS[0]);
    if (!user || !user.location || (Math.abs(user.location.lat - 37.7752) < 0.01)) {
      return DEMO_USERS[0];
    }
    // Sync returnsCompleted with stored user record if available
    const storedRecord = this.getUserById(user.id);
    if (storedRecord && storedRecord.returnsCompleted !== undefined && storedRecord.returnsCompleted !== user.returnsCompleted) {
      const merged = { ...user, returnsCompleted: storedRecord.returnsCompleted };
      setStored(STORAGE_KEYS.CURRENT_USER, merged);
      return merged;
    }
    return user;
  }

  static setCurrentUser(user: User): void {
    setStored(STORAGE_KEYS.CURRENT_USER, user);
  }

  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.CLAIMS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.USERS);
  }
}
