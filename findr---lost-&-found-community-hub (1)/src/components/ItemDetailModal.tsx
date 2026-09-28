import { useState, useEffect } from 'react';
import { 
  X, MapPin, Calendar, ShieldCheck, MessageSquare, Sparkles, 
  CheckCircle, AlertCircle, ArrowRight, UserCheck, ShieldAlert, Lock, CheckCircle2,
  Globe, ExternalLink, Loader2, QrCode
} from 'lucide-react';
import { Item, User, ClaimVerification, MatchAlert } from '../types';
import { calculateDistanceKm, formatDistance, calculateMatchScore } from '../utils/geo';
import { StorageService } from '../services/storage';
import { GeminiClient, GroundingCitation, MapPlace } from '../services/geminiClient';
import { InteractiveMap } from './InteractiveMap';
import { ItemTimeline } from './ItemTimeline';

interface ItemDetailModalProps {
  item: Item | null;
  currentUser: User;
  allItems: Item[];
  isOpen: boolean;
  onClose: () => void;
  onOpenClaim: (item: Item) => void;
  onOpenChat: (item: Item) => void;
  onSelectMatchItem: (matchItem: Item) => void;
  onItemUpdated: () => void;
  onOpenPrintFlyer?: (item: Item) => void;
}

export function ItemDetailModal({
  item,
  currentUser,
  allItems,
  isOpen,
  onClose,
  onOpenClaim,
  onOpenChat,
  onSelectMatchItem,
  onItemUpdated,
  onOpenPrintFlyer,
}: ItemDetailModalProps) {
  if (!isOpen || !item) return null;

  const [claims, setClaims] = useState<ClaimVerification[]>([]);
  const isReporter = item.reporterId === currentUser.id;
  const isLost = item.type === 'lost';
  const distanceKm = calculateDistanceKm(currentUser.location, item.location);

  // Search & Maps Grounding State
  const [searchResult, setSearchResult] = useState<{ text: string; citations: GroundingCitation[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mapsResult, setMapsResult] = useState<{ text: string; places: MapPlace[] } | null>(null);
  const [isMapping, setIsMapping] = useState(false);

  const handleRunSearchGrounding = async () => {
    setIsSearching(true);
    try {
      const prompt = `Where is the serial number located on this type of item, and what are the official manufacturer or police lost/found reporting procedures? Item: "${item.title}". Category: ${item.category}.`;
      const res = await GeminiClient.searchGrounding(prompt, item.description);
      setSearchResult(res);
    } catch (e: any) {
      console.error('Search grounding error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRunMapsGrounding = async () => {
    setIsMapping(true);
    try {
      const prompt = `Find safe public exchange zones, police station lobbies, or university campus security desks near ${item.location.name} for safely returning a lost item.`;
      const res = await GeminiClient.mapsGrounding(prompt, {
        lat: item.location.lat,
        lng: item.location.lng,
      });
      setMapsResult(res);
    } catch (e: any) {
      console.error('Maps grounding error:', e);
    } finally {
      setIsMapping(false);
    }
  };

  // Load claims for this item
  const loadClaims = () => {
    const itemClaims = StorageService.getClaims().filter(c => c.itemId === item.id);
    setClaims(itemClaims);
  };

  useEffect(() => {
    loadClaims();
  }, [item.id]);

  // Find user's claim if claimant
  const myClaim = claims.find(c => c.claimantId === currentUser.id);
  const approvedClaim = claims.find(c => c.status === 'approved');

  // Find potential matches in opposite items
  const oppositeType = isLost ? 'found' : 'lost';
  const candidateItems = allItems.filter(i => i.type === oppositeType && i.status !== 'reunited');
  const detectedMatches = candidateItems
    .map(candidate => {
      const match = isLost 
        ? calculateMatchScore(item, candidate) 
        : calculateMatchScore(candidate, item);
      return { item: candidate, ...match };
    })
    .filter(m => m.score >= 45)
    .sort((a, b) => b.score - a.score);

  const handleReviewClaim = (claimId: string, status: 'approved' | 'rejected') => {
    StorageService.reviewClaim(claimId, status);
    loadClaims();
    onItemUpdated();
  };

  const handleMarkReunited = () => {
    if (confirm('Mark this item as successfully reunited with rightful owner?')) {
      StorageService.markItemReunited(item.id);
      onItemUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-8 max-h-[90vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded ${
              isLost ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
            }`}>
              {isLost ? 'Lost Report' : 'Found Report'}
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">·</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums">{formatDistance(distanceKm)}</span>
            {item.status === 'reunited' && (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                🎉 Reunited
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLost && onOpenPrintFlyer && (
              <button
                type="button"
                onClick={() => onOpenPrintFlyer(item)}
                className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Generate printable flyer or adhesive QR code sticker"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                <span>QR Flyer / Sticker</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {/* Main Top: Photo & Core Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image */}
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs">
              <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Core Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-display leading-tight">
                  {item.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-mono">
                  <span className="capitalize">{item.category.replace('_', ' ')}</span>
                  <span>·</span>
                  <span>Reported {new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>

              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {item.description}
              </p>

              {/* Reward if Lost */}
              {item.reward && isLost && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold text-amber-900 dark:text-amber-200">
                  💰 Owner Reward Offered: {item.reward}
                </div>
              )}

              {/* Reporter summary */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={item.reporterAvatar}
                    alt={item.reporterName}
                    className="w-8 h-8 rounded-full object-cover border border-neutral-300 dark:border-neutral-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{item.reporterName}</div>
                    <div className="text-[11px] text-neutral-500">{isReporter ? 'You are the reporter' : 'Community member'}</div>
                  </div>
                </div>

                {/* Privacy Badge */}
                <div className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-neutral-400" />
                  <span>Contact info private</span>
                </div>
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="text-[11px] text-neutral-600 dark:text-neutral-400 font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transparent Recovery Process Timeline */}
          <ItemTimeline
            item={item}
            claims={claims}
            detectedMatchesCount={detectedMatches.length}
            topMatch={detectedMatches[0]}
          />

          {/* Finder's Ownership Verification Challenge Box */}
          {item.type === 'found' && (
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                    Ownership Evidence Challenge
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Peace of Mind Gate</span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                "{item.evidenceQuestion || 'What unique mark, engraving, or content proves this is yours?'}"
              </p>
              {item.evidenceHint && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                  Hint for claimant: {item.evidenceHint}
                </p>
              )}
            </div>
          )}

          {/* FINDER VIEW: Review Submitted Claims */}
          {isReporter && item.type === 'found' && (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-800/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Submitted Ownership Claims ({claims.length})</span>
                </h3>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Validate answers to unlock return chat</span>
              </div>

              {claims.length === 0 ? (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 py-2">
                  No claims submitted yet. Claimants must answer your challenge before contacting you.
                </p>
              ) : (
                <div className="space-y-3">
                  {claims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={claim.claimantAvatar}
                            alt={claim.claimantName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="font-bold text-neutral-900 dark:text-neutral-100">{claim.claimantName}</span>
                          <span className="text-neutral-400 dark:text-neutral-500">·</span>
                          <span className="text-neutral-500 dark:text-neutral-400 font-mono">{new Date(claim.createdAt).toLocaleDateString()}</span>
                        </div>

                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${
                          claim.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800' :
                          claim.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800' :
                          'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                        }`}>
                          {claim.status === 'approved' ? 'Verified Owner' : claim.status === 'rejected' ? 'Declined' : 'Pending Your Review'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium">
                        "{claim.evidenceAnswer}"
                      </div>

                      {claim.evidencePhotoUrl && (
                        <div>
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Supporting proof attached:</span>
                          <img
                            src={claim.evidencePhotoUrl}
                            alt="Evidence proof"
                            className="mt-1 w-20 h-20 rounded-md object-cover border border-neutral-300 dark:border-neutral-700"
                          />
                        </div>
                      )}

                      {/* Review Buttons if Pending */}
                      {claim.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                          <button
                            type="button"
                            onClick={() => handleReviewClaim(claim.id, 'rejected')}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewClaim(claim.id, 'approved')}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm True Owner & Unlock Chat</span>
                          </button>
                        </div>
                      )}

                      {claim.status === 'approved' && (
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">
                            ✅ Verified! Contact: {claim.claimantContact || 'Shared in chat'}
                          </span>
                          <button
                            onClick={() => onOpenChat(item)}
                            className="px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition cursor-pointer"
                          >
                            Open Return Chat
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Location Pin & Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                <MapPin className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <span>Pinned Location: {item.location.name}</span>
              </div>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
              </span>
            </div>

            <InteractiveMap
              center={[item.location.lat, item.location.lng]}
              zoom={15}
              items={[item]}
              heightClass="h-[180px]"
            />
          </div>

          {/* AI GROUNDING TOOLS: Google Search & Google Maps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Search Grounding Card */}
            <div className="p-4 bg-white dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-2.5 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                  <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Google Search Grounding</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">gemini-3.5-flash</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Search manufacturer lost mode procedures, serial number locations, and web recovery sources.
              </p>
              {!searchResult ? (
                <button
                  type="button"
                  onClick={handleRunSearchGrounding}
                  disabled={isSearching}
                  className="w-full py-2 px-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                      <span>Searching Google...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Search Recovery & Serial Info</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                  <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-neutral-800 dark:text-neutral-200 text-[11px] leading-relaxed max-h-36 overflow-y-auto">
                    {searchResult.text}
                  </div>
                  {searchResult.citations && searchResult.citations.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        Verified Web Sources:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {searchResult.citations.map((c, i) => (
                          <a
                            key={i}
                            href={c.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:underline text-[10px] rounded border border-blue-200 dark:border-blue-800 truncate max-w-xs"
                          >
                            <span className="truncate">{c.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Google Maps Grounding Card */}
            <div className="p-4 bg-white dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-2.5 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Google Maps Grounding</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">gemini-3.5-flash</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Locate verified safe exchange zones (police lobbies, campus desks) near this item.
              </p>
              {!mapsResult ? (
                <button
                  type="button"
                  onClick={handleRunMapsGrounding}
                  disabled={isMapping}
                  className="w-full py-2 px-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isMapping ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span>Querying Google Maps...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span>Find Safe Exchange Spots Nearby</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                  <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-neutral-800 dark:text-neutral-200 text-[11px] leading-relaxed max-h-36 overflow-y-auto">
                    {mapsResult.text}
                  </div>
                  {mapsResult.places && mapsResult.places.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        Google Maps Locations:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {mapsResult.places.map((p, i) => (
                          <a
                            key={i}
                            href={p.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:underline text-[10px] rounded border border-emerald-200 dark:border-emerald-800 truncate max-w-xs"
                          >
                            <span className="truncate">{p.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SMART PROXIMITY MATCHES SECTION */}
          {detectedMatches.length > 0 && (
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wide">
                    Smart Proximity Matches Detected Nearby ({detectedMatches.length})
                  </h3>
                </div>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Algorithm verified</span>
              </div>

              <div className="space-y-2">
                {detectedMatches.map(({ item: matchItem, score, reasons, distanceKm }) => (
                  <div
                    key={matchItem.id}
                    className="p-3 bg-white dark:bg-neutral-800 border border-blue-200 dark:border-neutral-700 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {matchItem.imageUrl && (
                        <img
                          src={matchItem.imageUrl}
                          alt={matchItem.title}
                          className="w-11 h-11 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                        />
                      )}
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[200px] sm:max-w-xs">
                          {matchItem.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                          {formatDistance(distanceKm)} · {score}% Match Confidence
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectMatchItem(matchItem)}
                      className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>Compare</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0 flex items-center justify-between transition-colors">
          <div>
            {isReporter ? (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Your report is active on the community map</span>
            ) : item.type === 'found' ? (
              myClaim ? (
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  Your evidence submission is {myClaim.status === 'approved' ? 'Verified!' : 'Under Review'}
                </span>
              ) : (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Must pass verification challenge to claim</span>
              )
            ) : (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Contact reporter if you found this item</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isReporter && item.status !== 'reunited' && (
              <button
                type="button"
                onClick={handleMarkReunited}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 rounded-lg transition cursor-pointer"
              >
                Mark Reunited
              </button>
            )}

            {/* If Claimant on Found Item */}
            {!isReporter && item.type === 'found' && (
              <>
                {!myClaim ? (
                  <button
                    type="button"
                    onClick={() => onOpenClaim(item)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Claim This Item (Prove Ownership)</span>
                  </button>
                ) : myClaim.status === 'approved' ? (
                  <button
                    type="button"
                    onClick={() => onOpenChat(item)}
                    className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Safe Return Chat</span>
                  </button>
                ) : (
                  <div className="px-3.5 py-2 text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 rounded-lg">
                    Evidence Under Review by Finder
                  </div>
                )}
              </>
            )}

            {isLost && onOpenPrintFlyer && (
              <button
                type="button"
                onClick={() => onOpenPrintFlyer(item)}
                className="px-3.5 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <QrCode className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                <span>Print QR Flyer</span>
              </button>
            )}

            {/* Direct Chat access if already verified or for general safe return inquiry */}
            {(approvedClaim || isReporter || item.type === 'lost') && (
              <button
                type="button"
                onClick={() => onOpenChat(item)}
                className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Return Chat</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
