import { Coordinates, Item, MatchAlert } from '../types';

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Formats distance cleanly for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return 'Within 100 m';
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

export { DEFAULT_FALLBACK_LOCATION, determineUserGeolocation } from '../services/geolocationService';

/**
 * Common campus / metro landmark presets for quick pinning
 */
export const LANDMARK_PRESETS = [
  { name: 'Connaught Place Central Circle', lat: 28.6315, lng: 77.2167, address: 'Connaught Place, New Delhi' },
  { name: 'India Gate & Central Vista Lawns', lat: 28.6129, lng: 77.2295, address: 'Rajpath, India Gate, New Delhi' },
  { name: 'Delhi University North Campus Library', lat: 28.6892, lng: 77.2104, address: 'University Road, Delhi' },
  { name: 'Lodhi Garden Heritage Park', lat: 28.5931, lng: 77.2197, address: 'Lodhi Road, New Delhi' },
  { name: 'City Police Headquarters (Safe Exchange Zone)', lat: 28.6290, lng: 77.2340, address: 'ITO, New Delhi' },
  { name: 'New Delhi Railway Central Terminal', lat: 28.6429, lng: 77.2195, address: 'Bhavbhuti Marg, New Delhi' },
  { name: 'South Extension Market Center', lat: 28.5708, lng: 77.2230, address: 'South Extension, New Delhi' },
];

/**
 * Tokenizes text into lowercase normalized keyword tokens
 */
function extractTokens(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

const STOP_WORDS = new Set([
  'the', 'and', 'with', 'for', 'this', 'that', 'have', 'from', 'lost', 'found',
  'some', 'near', 'around', 'area', 'item', 'please', 'help', 'yesterday', 'today'
]);

/**
 * Smart Match Engine: detects proximity and textual correlation between
 * a lost item and a found item.
 */
export function calculateMatchScore(lostItem: Item, foundItem: Item): {
  score: number;
  reasons: string[];
  distanceKm: number;
} {
  // Ensure we are comparing a lost item with a found item
  if (lostItem.type !== 'lost' || foundItem.type !== 'found') {
    return { score: 0, reasons: [], distanceKm: 999 };
  }

  const distanceKm = calculateDistanceKm(lostItem.location, foundItem.location);
  const reasons: string[] = [];
  let score = 0;

  // 1. Category match (35 pts)
  if (lostItem.category === foundItem.category) {
    score += 35;
    reasons.push(`Matching category: ${lostItem.category.replace('_', ' ')}`);
  }

  // 2. Keyword similarity in title and description (up to 40 pts)
  const lostTokens = extractTokens(`${lostItem.title} ${lostItem.description} ${lostItem.tags.join(' ')}`);
  const foundTokens = extractTokens(`${foundItem.title} ${foundItem.description} ${foundItem.tags.join(' ')}`);

  let sharedKeywords: string[] = [];
  for (const token of lostTokens) {
    if (foundTokens.has(token)) {
      sharedKeywords.push(token);
    }
  }

  if (sharedKeywords.length > 0) {
    const keywordScore = Math.min(40, sharedKeywords.length * 12);
    score += keywordScore;
    reasons.push(`Shared identifiers: "${sharedKeywords.slice(0, 3).join(', ')}"`);
  }

  // 3. Proximity score (up to 25 pts)
  if (distanceKm <= 0.5) {
    score += 25;
    reasons.push(`Within 500m proximity (${formatDistance(distanceKm)})`);
  } else if (distanceKm <= 1.5) {
    score += 18;
    reasons.push(`Within 1.5 km proximity (${formatDistance(distanceKm)})`);
  } else if (distanceKm <= 3.5) {
    score += 10;
    reasons.push(`In the same neighborhood (${formatDistance(distanceKm)})`);
  } else if (distanceKm <= 8.0) {
    score += 5;
  }

  // 4. Date sanity check (if found before lost by > 1 day, reduce)
  const lostDate = new Date(lostItem.date).getTime();
  const foundDate = new Date(foundItem.date).getTime();
  const timeDiffHours = (foundDate - lostDate) / (1000 * 60 * 60);

  if (timeDiffHours >= -12 && timeDiffHours <= 168) {
    // Found within 7 days after being lost
    score += 5;
    reasons.push('Timeline aligns within discovery window');
  }

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    score: finalScore,
    reasons,
    distanceKm
  };
}

/**
 * Scans a list of items and generates match alerts for any active lost/found pairs
 * with a high enough match score.
 */
export function detectAllMatches(items: Item[]): MatchAlert[] {
  const lostItems = items.filter(i => i.type === 'lost' && i.status === 'active');
  const foundItems = items.filter(i => i.type === 'found' && i.status === 'active');
  const alerts: MatchAlert[] = [];

  for (const lost of lostItems) {
    for (const found of foundItems) {
      const match = calculateMatchScore(lost, found);
      // Threshold: 50% score and within 6km
      if (match.score >= 50 && match.distanceKm <= 6) {
        alerts.push({
          id: `match_${lost.id}_${found.id}`,
          recipientId: lost.reporterId,
          lostItemId: lost.id,
          foundItemId: found.id,
          lostItemTitle: lost.title,
          foundItemTitle: found.title,
          matchScore: match.score,
          distanceKm: match.distanceKm,
          reasons: match.reasons,
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  return alerts;
}
