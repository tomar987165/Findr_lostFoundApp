import { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, MapPin, Sparkles, ShieldCheck, CheckCircle2, 
  Image as ImageIcon, Loader2, Tag, Wand2, Check, ArrowRight, Lightbulb 
} from 'lucide-react';
import { Item, ItemCategory, ItemType, User, LocationData, MatchAlert } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { LANDMARK_PRESETS } from '../utils/geo';
import { StorageService } from '../services/storage';
import { GeminiClient, AutoTagsResult } from '../services/geminiClient';

// Preset sample photos for fast testing
import airpodsImg from '../assets/images/lost_airpods_pro_1790511974671.jpg';
import walletImg from '../assets/images/found_leather_wallet_1790511997499.jpg';
import retrieverImg from '../assets/images/lost_golden_retriever_1790512011538.jpg';
import keysImg from '../assets/images/found_keys_lanyard_1790512023418.jpg';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onItemCreated: (item: Item, newMatches: MatchAlert[]) => void;
}

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'electronics', label: 'Electronics & Audio' },
  { id: 'wallets_bags', label: 'Wallets & Bags' },
  { id: 'keys', label: 'Keys & Fobs' },
  { id: 'pets', label: 'Pets & Animals' },
  { id: 'jewelry', label: 'Jewelry & Watches' },
  { id: 'clothing', label: 'Clothing & Gear' },
  { id: 'documents', label: 'IDs & Documents' },
  { id: 'other', label: 'Other Items' },
];

export function ReportModal({ isOpen, onClose, currentUser, onItemCreated }: ReportModalProps) {
  if (!isOpen) return null;

  const [type, setType] = useState<ItemType>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory>('electronics');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Photo
  const [imageUrl, setImageUrl] = useState<string>(airpodsImg);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Location
  const [selectedLocation, setSelectedLocation] = useState<LocationData>(() => ({
    name: currentUser.location?.name || 'New Delhi, India',
    lat: currentUser.location?.lat || 28.6139,
    lng: currentUser.location?.lng || 77.2090,
    address: currentUser.location?.address || 'New Delhi, India'
  }));
  const [showMapPicker, setShowMapPicker] = useState(true);

  // Sync selected location if currentUser changes
  useEffect(() => {
    if (currentUser?.location) {
      setSelectedLocation(currentUser.location);
    }
  }, [currentUser]);

  // Verification challenge for Found items
  const [evidenceQuestion, setEvidenceQuestion] = useState(
    'What unique mark, engraving, lockscreen, or specific item inside proves you own this?'
  );
  const [evidenceHint, setEvidenceHint] = useState(
    'Describe the distinguishing color, contents, or serial identifier.'
  );

  // For Lost items
  const [reward, setReward] = useState('');
  const [tags, setTags] = useState('airpods, white, wireless, apple');

  // Gemini Auto-Tagging & Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoTagsResult, setAutoTagsResult] = useState<AutoTagsResult | null>(null);
  const [autoTagError, setAutoTagError] = useState<string | null>(null);
  const [appliedCategoryAlert, setAppliedCategoryAlert] = useState(false);

  // Trigger Gemini Auto-Tagging
  const handleAnalyzeWithGemini = async () => {
    if (!description.trim() && !title.trim()) {
      setAutoTagError('Enter an item title or description first so Gemini can analyze it.');
      return;
    }
    setIsAnalyzing(true);
    setAutoTagError(null);
    try {
      const result = await GeminiClient.getAutoTags({
        title: title.trim(),
        description: description.trim(),
        locationName: selectedLocation.name,
        type,
      });
      setAutoTagsResult(result);
    } catch (err: any) {
      console.error('Auto-tagging error:', err);
      setAutoTagError(err?.message || 'Failed to auto-tag with Gemini');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add a suggested tag
  const handleAddTag = (tagToAdd: string) => {
    const current = tags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);
    const cleanTag = tagToAdd.trim().toLowerCase();
    if (!current.includes(cleanTag)) {
      current.push(cleanTag);
      setTags(current.join(', '));
    }
  };

  // Apply suggested category
  const handleApplyCategory = (catId: string) => {
    if (CATEGORIES.some(c => c.id === catId)) {
      setCategory(catId as ItemCategory);
      setAppliedCategoryAlert(true);
      setTimeout(() => setAppliedCategoryAlert(false), 2000);
    }
  };

  // Apply all suggestions
  const handleApplyAllSuggestions = () => {
    if (!autoTagsResult) return;
    
    // Category
    if (autoTagsResult.category && CATEGORIES.some(c => c.id === autoTagsResult.category)) {
      setCategory(autoTagsResult.category as ItemCategory);
    }

    // Merge tags
    const current = tags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    const newTags = [
      ...(autoTagsResult.locationTags || []),
      ...(autoTagsResult.descriptorTags || []),
    ].map(t => t.trim().toLowerCase());

    newTags.forEach(t => {
      if (t && !current.includes(t)) {
        current.push(t);
      }
    });
    setTags(current.join(', '));

    // Refined Location name if found
    if (autoTagsResult.detectedLocationName && autoTagsResult.detectedLocationName.trim()) {
      setSelectedLocation(prev => ({
        ...prev,
        name: autoTagsResult.detectedLocationName!
      }));
    }

    // Ownership question if found item
    if (type === 'found' && autoTagsResult.suggestedEvidenceQuestion) {
      setEvidenceQuestion(autoTagsResult.suggestedEvidenceQuestion);
    }

    setAppliedCategoryAlert(true);
    setTimeout(() => setAppliedCategoryAlert(false), 2500);
  };

  // Quick prompt testers
  const handleLoadSampleScenario = (scenario: 'gym' | 'library' | 'cafe') => {
    if (scenario === 'gym') {
      setTitle('Navy Blue Hydro Flask with Gym Stickers');
      setDescription('Left my 32oz wide-mouth Hydro Flask on the bench near the basketball court / weight room at the Campus Recreation Center Gym.');
      setImageUrl(airpodsImg);
    } else if (scenario === 'library') {
      setTitle('Silver MacBook Pro in Gray Felt Sleeve');
      setDescription('Found a 14-inch MacBook Pro left on desk #14 on the 3rd floor quiet study area at Central University Library.');
      setType('found');
    } else if (scenario === 'cafe') {
      setTitle('Brown Leather Bi-fold Wallet');
      setDescription('Lost my Fossil wallet containing student ID and transit pass near the campus student union cafe patio tables.');
      setImageUrl(walletImg);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    const newItem: Item = {
      id: `item_${Date.now()}`,
      type,
      title: title.trim(),
      description: description.trim(),
      category,
      date: new Date(date).toISOString(),
      location: selectedLocation,
      imageUrl,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterAvatar: currentUser.avatar,
      reporterContact: currentUser.email,
      status: 'active',
      tags: parsedTags,
      reward: type === 'lost' && reward.trim() ? reward.trim() : undefined,
      evidenceQuestion: type === 'found' ? evidenceQuestion.trim() : undefined,
      evidenceHint: type === 'found' ? evidenceHint.trim() : undefined,
      createdAt: new Date().toISOString()
    };

    const { item, newMatches } = StorageService.addItem(newItem);
    onItemCreated(item, newMatches);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-8 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-display">Report an Item</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Broadcast your report to nearby community members with smart match detection
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Item Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('lost')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  type === 'lost'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-600 dark:border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-600/20'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <span>🔍 I Lost Something</span>
              </button>

              <button
                type="button"
                onClick={() => setType('found')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  type === 'found'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-600/20'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <span>📦 I Found Something</span>
              </button>
            </div>
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Item Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'lost' ? 'e.g., Black Leather Fossil Wallet' : 'e.g., Found Silver iPhone 13 in Blue Case'}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id} className="dark:bg-neutral-800 dark:text-neutral-100">{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description with Gemini Auto-Tagging */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Description & Distinguishing Features
              </label>
              
              <button
                type="button"
                onClick={handleAnalyzeWithGemini}
                disabled={isAnalyzing}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-1.5 transition disabled:opacity-60 cursor-pointer shadow-2xs"
                title="Use Gemini API to analyze description and suggest categories and location tags"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Auto-Tag with Gemini</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'lost' ? 'Provide details, where you might have left it (e.g. gym, library, quad), exact brand, condition...' : 'Describe general condition and location without giving away secret details (the evidence question handles that)...'}
              className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
            />

            {/* Quick Scenario Fillers to test auto-tagging immediately */}
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="text-neutral-400 dark:text-neutral-500">Try sample scenario:</span>
              <button
                type="button"
                onClick={() => handleLoadSampleScenario('gym')}
                className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-700 dark:text-neutral-300 font-medium transition cursor-pointer"
              >
                Gym Workout
              </button>
              <button
                type="button"
                onClick={() => handleLoadSampleScenario('library')}
                className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-700 dark:text-neutral-300 font-medium transition cursor-pointer"
              >
                Library Study
              </button>
              <button
                type="button"
                onClick={() => handleLoadSampleScenario('cafe')}
                className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-700 dark:text-neutral-300 font-medium transition cursor-pointer"
              >
                Campus Cafe
              </button>
            </div>

            {/* Error banner if any */}
            {autoTagError && (
              <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {autoTagError}
              </div>
            )}

            {/* Gemini Auto-Tagging Suggestions Card */}
            {autoTagsResult && (
              <div className="mt-3 p-4 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white dark:from-neutral-900 dark:via-blue-950/20 dark:to-neutral-900 border border-blue-200/90 dark:border-blue-900/60 rounded-xl space-y-3 text-left shadow-2xs">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-blue-100 dark:border-neutral-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 font-display">
                        Gemini AI Auto-Tagging Suggestions
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {autoTagsResult.rationale || 'Analyzed from description and location context.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyAllSuggestions}
                    className="px-3 py-1 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                  >
                    <Check className="w-3 h-3 text-emerald-400 dark:text-emerald-600" />
                    <span>Apply All AI Suggestions</span>
                  </button>
                </div>

                {/* 1. Category Suggestion */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-600 dark:text-neutral-400 text-[11px] uppercase tracking-wider">
                      Suggested Category:
                    </span>
                    <span className="font-bold text-blue-900 dark:text-blue-200 bg-blue-100/80 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 capitalize">
                      {autoTagsResult.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                      ({autoTagsResult.categoryConfidence}% confidence)
                    </span>
                  </div>

                  {category !== autoTagsResult.category ? (
                    <button
                      type="button"
                      onClick={() => handleApplyCategory(autoTagsResult.category)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-neutral-700 border border-blue-300 dark:border-blue-700 rounded-md transition cursor-pointer"
                    >
                      Apply "{autoTagsResult.category.replace('_', ' ')}"
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Category Selected</span>
                    </span>
                  )}
                </div>

                {/* 2. Suggested Location Tags (e.g., 'library', 'campus', 'gym') */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Suggested Location Tags (Click to add):</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Boosts spatial proximity matching</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {autoTagsResult.locationTags && autoTagsResult.locationTags.length > 0 ? (
                      autoTagsResult.locationTags.map((locTag) => {
                        const isAdded = tags.toLowerCase().includes(locTag.toLowerCase());
                        return (
                          <button
                            key={locTag}
                            type="button"
                            onClick={() => handleAddTag(locTag)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                              isAdded
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-neutral-700'
                            }`}
                          >
                            <span>{isAdded ? '✓' : '+'}</span>
                            <span>{locTag}</span>
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500">None detected</span>
                    )}
                  </div>
                </div>

                {/* 3. Suggested Descriptor Tags */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>Suggested Item Descriptors:</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {autoTagsResult.descriptorTags && autoTagsResult.descriptorTags.map((descTag) => {
                      const isAdded = tags.toLowerCase().includes(descTag.toLowerCase());
                      return (
                        <button
                          key={descTag}
                          type="button"
                          onClick={() => handleAddTag(descTag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            isAdded
                              ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                              : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-neutral-700'
                          }`}
                        >
                          <span>{isAdded ? '✓' : '+'}</span>
                          <span>{descTag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional: Refined Location Name Suggestion */}
                {autoTagsResult.detectedLocationName && autoTagsResult.detectedLocationName.trim() && (
                  <div className="pt-2 border-t border-blue-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <span className="text-neutral-600 dark:text-neutral-300 text-[11px]">
                      Specific place identified: <strong>"{autoTagsResult.detectedLocationName}"</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocation(prev => ({
                          ...prev,
                          name: autoTagsResult.detectedLocationName!
                        }));
                      }}
                      className="px-2.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded text-[11px] font-medium text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
                    >
                      Update Pinned Spot Name
                    </button>
                  </div>
                )}

                {/* Optional: Found Item Suggested Ownership Question */}
                {type === 'found' && autoTagsResult.suggestedEvidenceQuestion && (
                  <div className="pt-2 border-t border-blue-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 dark:text-emerald-300 text-[11px] truncate max-w-[340px]">
                      Suggested Challenge: <em>"{autoTagsResult.suggestedEvidenceQuestion}"</em>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEvidenceQuestion(autoTagsResult.suggestedEvidenceQuestion!)}
                      className="px-2.5 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold transition cursor-pointer shrink-0"
                    >
                      Use AI Question
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Photo Upload with quick presets */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Item Photo
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/40">
              {imageUrl ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500">
                  <ImageIcon className="w-8 h-8 stroke-1" />
                </div>
              )}

              <div className="flex-1 space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Your Photo</span>
                  </button>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">or pick a sample:</span>
                </div>

                {/* Sample Photo selector */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setImageUrl(airpodsImg)}
                    className="px-2 py-1 text-[11px] bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded font-medium transition cursor-pointer"
                  >
                    AirPods
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl(walletImg)}
                    className="px-2 py-1 text-[11px] bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded font-medium transition cursor-pointer"
                  >
                    Leather Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl(keysImg)}
                    className="px-2 py-1 text-[11px] bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded font-medium transition cursor-pointer"
                  >
                    Keyring
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl(retrieverImg)}
                    className="px-2 py-1 text-[11px] bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded font-medium transition cursor-pointer"
                  >
                    Pet / Dog
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Location Pinning */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>Pinned Location ({type === 'lost' ? 'Where lost' : 'Where found'})</span>
              </label>
              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                {showMapPicker ? 'Hide map pin' : 'Show interactive pin map'}
              </button>
            </div>

            {/* Quick Landmark Preset selector */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {LANDMARK_PRESETS.slice(0, 4).map((landmark) => (
                <button
                  key={landmark.name}
                  type="button"
                  onClick={() => setSelectedLocation({
                    name: landmark.name,
                    lat: landmark.lat,
                    lng: landmark.lng,
                    address: landmark.address
                  })}
                  className={`text-xs px-2.5 py-1 rounded-md border transition cursor-pointer ${
                    selectedLocation.name === landmark.name
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  {landmark.name.split(' (')[0]}
                </button>
              ))}
            </div>

            {/* Interactive Leaflet Pin Drop Map */}
            {showMapPicker && (
              <div className="mb-3">
                <InteractiveMap
                  isPickerMode={true}
                  selectedLocation={selectedLocation}
                  center={[selectedLocation.lat, selectedLocation.lng]}
                  zoom={16}
                  heightClass="h-[220px]"
                  onLocationSelect={(coords) => {
                    setSelectedLocation(prev => ({
                      ...prev,
                      name: prev.name.includes('Custom') ? prev.name : `Pinned Spot (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
                      lat: coords.lat,
                      lng: coords.lng
                    }));
                  }}
                />
              </div>
            )}

            {/* Location Name & Address input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={selectedLocation.name}
                onChange={(e) => setSelectedLocation(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Location description (e.g. 2nd floor library)"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:bg-white dark:focus:bg-neutral-800 focus:outline-none"
              />
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono flex items-center px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                GPS: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Crucial Feature: Ownership Evidence Challenge (Peace of mind) */}
          {type === 'found' && (
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                    Ownership Evidence Challenge (Protection & Peace of Mind)
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    To prevent fraudulent claims and protect your contact info, specify a question only the true owner would know.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                  Verification Question to Claimant:
                </label>
                <input
                  type="text"
                  required
                  value={evidenceQuestion}
                  onChange={(e) => setEvidenceQuestion(e.target.value)}
                  placeholder="e.g. What photo is on the phone wallpaper? / What initials are embossed?"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-emerald-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                  Public Guidance Hint (Optional):
                </label>
                <input
                  type="text"
                  value={evidenceHint}
                  onChange={(e) => setEvidenceHint(e.target.value)}
                  placeholder="e.g. Describe the color of the keychain charm or lockscreen subject"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-emerald-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>
          )}

          {/* Keywords / Search & Location Tags (Active for both Lost and Found) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>Search Keywords & Location Tags</span>
              </label>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                {tags.split(',').filter(t => t.trim()).length} tags active
              </span>
            </div>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma-separated tags e.g. library, campus, gym, airpods, white"
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:bg-white dark:focus:bg-neutral-800 focus:outline-none"
            />
            {/* Visual chip badges of active tags with delete */}
            {tags.trim() && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.split(',').map(t => t.trim()).filter(Boolean).map((t, idx) => (
                  <span
                    key={`${t}-${idx}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-mono border border-neutral-200 dark:border-neutral-700"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const remaining = tags.split(',').map(x => x.trim()).filter(x => x && x !== t);
                        setTags(remaining.join(', '));
                      }}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded ml-0.5 cursor-pointer"
                      title={`Remove tag #${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Optional Reward for Lost Items */}
          {type === 'lost' && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Optional Reward Offer
              </label>
              <input
                type="text"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="e.g. $50 Cash Reward or Free Coffee"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:bg-white dark:focus:bg-neutral-800 focus:outline-none"
              />
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Smart proximity match will run immediately</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition shadow-sm cursor-pointer"
              >
                Publish Report
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
