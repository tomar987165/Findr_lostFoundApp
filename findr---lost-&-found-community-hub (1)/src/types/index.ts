export type ItemType = 'lost' | 'found';

export type ItemCategory = 
  | 'electronics' 
  | 'wallets_bags' 
  | 'keys' 
  | 'pets' 
  | 'jewelry' 
  | 'clothing' 
  | 'documents' 
  | 'other';

export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  landmark?: string;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  minReunions: number;
  icon: 'ShieldCheck' | 'Award' | 'Trophy' | 'Sparkles' | 'Crown' | 'HeartHandshake' | 'Medal';
  tier: BadgeTier;
  tagline: string;
  perk: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  rating?: number;
  returnsCompleted?: number;
  location: LocationData;
  customBadges?: string[];
}

export type ItemStatusStage = 'reported' | 'match_found' | 'under_review' | 'reunited';

export interface ItemTimelineEvent {
  id: string;
  stage: ItemStatusStage;
  label: string;
  timestamp: string;
  description: string;
  actor?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: ItemCategory;
  date: string;
  location: LocationData;
  imageUrl: string;
  imageFallback?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  reporterId: string;
  reporterName: string;
  reporterAvatar: string;
  reporterContact?: string;
  
  // Ownership verification for peace of mind
  evidenceQuestion?: string;      // Finder asks: "What color is the back sticker?" or "What initials are engraved?"
  evidenceHint?: string;          // Optional guidance for claimant
  secretIdentifier?: string;      // Private identifier (kept secret until matched)
  
  status: 'active' | 'pending_verification' | 'reunited';
  tags: string[];
  reward?: string;
  createdAt: string;
  timeline?: ItemTimelineEvent[];
}

export interface ClaimVerification {
  id: string;
  itemId: string;
  itemTitle: string;
  itemType: ItemType;
  finderId: string;
  claimantId: string;
  claimantName: string;
  claimantAvatar: string;
  claimantContact?: string;
  
  questionAsked: string;
  evidenceAnswer: string;
  evidencePhotoUrl?: string;
  
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ChatMessage {
  id: string;
  itemId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isSystemNotice?: boolean;
  meetingProposal?: {
    location: string;
    proposedTime: string;
    isAccepted?: boolean;
  };
}

export interface VisualMatchResult {
  isPerfectMatch: boolean;
  visualMatchScore: number; // 0-100%
  matchVerdict: 'perfect_match' | 'probable_match' | 'mismatch';
  visualEvidence: string[];
  discrepancies: string[];
  mediaAnalyzed: 'image' | 'video' | 'multimodal';
  summary: string;
}

export interface MatchAlert {
  id: string;
  recipientId: string;
  lostItemId: string;
  foundItemId: string;
  lostItemTitle: string;
  foundItemTitle: string;
  matchScore: number; // 0-100%
  distanceKm: number;
  reasons: string[];
  isRead: boolean;
  createdAt: string;

  // Image & Video Visual Match Verification
  isVisualMatchVerified?: boolean;
  visualMatchScore?: number;
  visualMatchReason?: string;
  visualEvidence?: string[];
  discrepancies?: string[];
  mediaTypeMatched?: 'image' | 'video' | 'multimodal';
}

export interface Coordinates {
  lat: number;
  lng: number;
}
