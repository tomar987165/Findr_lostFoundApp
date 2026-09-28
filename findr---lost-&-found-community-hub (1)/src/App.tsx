import { useState, useEffect, useMemo } from 'react';
import { 
  Search, SlidersHorizontal, MapPin, Compass, ShieldCheck, 
  MessageSquare, Plus, Sparkles, Filter, CheckCircle2, RotateCcw,
  ArrowRight, AlertCircle, Eye
} from 'lucide-react';
import { Item, ItemCategory, ItemType, User, MatchAlert } from './types';
import { DEMO_USERS } from './data/mockData';
import { StorageService } from './services/storage';
import { calculateDistanceKm, formatDistance } from './utils/geo';
import { Header } from './components/Header';
import { ItemCard } from './components/ItemCard';
import { ReportModal } from './components/ReportModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ClaimEvidenceModal } from './components/ClaimEvidenceModal';
import { ReturnChatModal } from './components/ReturnChatModal';
import { MatchNotificationsDrawer } from './components/MatchNotificationsDrawer';
import { MatchComparisonModal } from './components/MatchComparisonModal';
import { InteractiveMap } from './components/InteractiveMap';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { GeminiChatbotModal } from './components/GeminiChatbotModal';
import { PrintableFlyerModal } from './components/PrintableFlyerModal';
import { EmailInboxModal } from './components/EmailInboxModal';
import { MockEmailService } from './services/emailService';
import { DEFAULT_FALLBACK_LOCATION, determineUserGeolocation } from './services/geolocationService';

const CATEGORIES: { id: 'all' | ItemCategory; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'wallets_bags', label: 'Wallets & Bags' },
  { id: 'keys', label: 'Keys' },
  { id: 'pets', label: 'Pets' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'documents', label: 'IDs & Docs' },
  { id: 'other', label: 'Other' },
];

export default function App() {
  // Global state
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getCurrentUser());
  const [items, setItems] = useState<Item[]>(() => StorageService.getItems());
  const [alerts, setAlerts] = useState<MatchAlert[]>(() => StorageService.getAlerts(currentUser.id));
  
  // Navigation
  const [currentTab, setCurrentTab] = useState<'items' | 'map' | 'messages' | 'my-reports'>('items');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ItemType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ItemCategory>('all');
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'reunited'>('all');

  // Modals & Drawers
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<Item | null>(null);
  const [itemForClaim, setItemForClaim] = useState<Item | null>(null);
  const [itemForChat, setItemForChat] = useState<Item | null>(null);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [comparisonModalData, setComparisonModalData] = useState<{ lostItem: Item; foundItem: Item } | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isChatbotModalOpen, setIsChatbotModalOpen] = useState(false);
  const [itemForFlyer, setItemForFlyer] = useState<Item | null>(null);
  const [isEmailInboxOpen, setIsEmailInboxOpen] = useState(false);

  // Unread emails count for current persona
  const unreadEmailCount = useMemo(() => {
    return MockEmailService.getSentEmails(currentUser.email).filter(e => !e.isRead).length;
  }, [currentUser.email, items, isEmailInboxOpen]);

  // Auto-open item if scanned via QR code link (?item=id)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scannedItemId = params.get('item');
    if (scannedItemId) {
      const matched = items.find(i => i.id === scannedItemId);
      if (matched) {
        setSelectedItemForDetail(matched);
      }
    }
  }, [items]);

  // Geolocation detection state
  const [isLocating, setIsLocating] = useState(false);

  // Automatically request user's geolocation with New Delhi fallback handling
  const handleDetectLocation = async (isManual = false) => {
    setIsLocating(true);
    try {
      const geoResult = await determineUserGeolocation();
      if (geoResult.isRealTime) {
        setCurrentUser(prev => {
          const updated = {
            ...prev,
            location: geoResult.location
          };
          StorageService.setCurrentUser(updated);
          return updated;
        });
        showToast(`📍 Located: ${geoResult.location.name}`);
      } else {
        // Fallback handling: permission denied, timed out, unavailable, or unsupported
        setCurrentUser(prev => {
          const updated = {
            ...prev,
            location: { ...DEFAULT_FALLBACK_LOCATION }
          };
          StorageService.setCurrentUser(updated);
          return updated;
        });
        if (isManual) {
          showToast(`📍 Defaulted to New Delhi, India (${geoResult.errorMessage || 'permission denied'})`);
        }
      }
    } catch (err) {
      console.error('[App] Geolocation detection error:', err);
      setCurrentUser(prev => ({
        ...prev,
        location: { ...DEFAULT_FALLBACK_LOCATION }
      }));
    } finally {
      setIsLocating(false);
    }
  };

  // Run geolocation initialization once on mount
  useEffect(() => {
    handleDetectLocation(false);
  }, []);

  // Hamburger push menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Refresh data from storage
  const reloadData = () => {
    setItems(StorageService.getItems());
    setAlerts(StorageService.getAlerts(currentUser.id));
  };

  // Handle user switch
  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    StorageService.setCurrentUser(user);
    setAlerts(StorageService.getAlerts(user.id));
    showToast(`Switched active profile to ${user.name}`);
  };

  // Check unread alerts
  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Type
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      // Category
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      // Status
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesLoc = item.location.name.toLowerCase().includes(q);
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesTags) return false;
      }
      // Distance
      const distance = calculateDistanceKm(currentUser.location, item.location);
      if (distance > maxRadiusKm) return false;

      return true;
    });
  }, [items, typeFilter, categoryFilter, statusFilter, searchQuery, maxRadiusKm, currentUser.location]);

  // Find if current user has an active lost report with a matching alert
  const topActiveMatchAlert = useMemo(() => {
    return alerts.find(a => !a.isRead && a.matchScore >= 70);
  }, [alerts]);

  return (
    <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col antialiased transition-colors">
      {/* Top Bar Header adhering to Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenReport={() => setIsReportModalOpen(true)}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        alerts={alerts}
        onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
        unreadCount={unreadAlertsCount}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onOpenChatbot={() => setIsChatbotModalOpen(true)}
        onOpenEmailInbox={() => setIsEmailInboxOpen(true)}
        unreadEmailCount={unreadEmailCount}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        onCloseMenu={() => setIsMenuOpen(false)}
        onRefreshLocation={() => handleDetectLocation(true)}
        isLocating={isLocating}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Active Proximity Match Alert Banner (if any) */}
        {topActiveMatchAlert && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-md border border-blue-800/60 dark:border-blue-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    Proximity Match Detected ({topActiveMatchAlert.matchScore}% Match)
                  </span>
                  <span className="text-xs font-mono text-blue-200">
                    · {formatDistance(topActiveMatchAlert.distanceKm)}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  A potential match for "{topActiveMatchAlert.lostItemTitle}" was found nearby!
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const lost = items.find(i => i.id === topActiveMatchAlert.lostItemId);
                  const found = items.find(i => i.id === topActiveMatchAlert.foundItemId);
                  if (lost && found) {
                    setComparisonModalData({ lostItem: lost, foundItem: found });
                    StorageService.markAlertAsRead(topActiveMatchAlert.id);
                    reloadData();
                  }
                }}
                className="px-4 py-2 bg-white text-blue-950 text-xs font-bold rounded-lg hover:bg-blue-50 transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span>Compare Items</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: FEED OF ITEMS */}
        {currentTab === 'items' && (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4 transition-colors">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by item name, keywords, or location (e.g. AirPods, keys, library)..."
                    className="w-full pl-10 pr-4 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Segmented Filter: All vs Lost vs Found */}
                <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg shrink-0">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      typeFilter === 'all' 
                        ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white shadow-xs' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    All Items ({items.length})
                  </button>
                  <button
                    onClick={() => setTypeFilter('lost')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      typeFilter === 'lost' 
                        ? 'bg-white dark:bg-neutral-700 text-amber-900 dark:text-amber-300 shadow-xs' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Lost ({items.filter(i => i.type === 'lost').length})
                  </button>
                  <button
                    onClick={() => setTypeFilter('found')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      typeFilter === 'found' 
                        ? 'bg-white dark:bg-neutral-700 text-emerald-900 dark:text-emerald-300 shadow-xs' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Found ({items.filter(i => i.type === 'found').length})
                  </button>
                </div>
              </div>

              {/* Secondary Filters: Category & Radius */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                        categoryFilter === cat.id
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Distance Radius */}
                <div className="flex items-center gap-2 font-medium text-neutral-600 dark:text-neutral-400 ml-auto shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                  <span>Proximity:</span>
                  <select
                    value={maxRadiusKm}
                    onChange={(e) => setMaxRadiusKm(Number(e.target.value))}
                    className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer focus:outline-none"
                  >
                    <option value={1}>Within 1 km</option>
                    <option value={3}>Within 3 km</option>
                    <option value={5}>Within 5 km</option>
                    <option value={15}>Within 15 km</option>
                    <option value={50}>Any Distance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto stroke-1" />
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 font-display">No matching items found</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                  Try adjusting your search terms, widening the proximity radius, or be the first to report this item.
                </p>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition cursor-pointer"
                >
                  + Report an Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map(item => {
                  const hasMatch = alerts.some(a => a.lostItemId === item.id || a.foundItemId === item.id);
                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      currentUser={currentUser}
                      onSelect={(selected) => setSelectedItemForDetail(selected)}
                      hasMatchDetected={hasMatch}
                      onOpenPrintFlyer={(it) => setItemForFlyer(it)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: INTERACTIVE MAP */}
        {currentTab === 'map' && (
          <div className="space-y-4">
            {/* Map Header with Filters */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">Map Filter:</span>
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${typeFilter === 'all' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}
                >
                  All ({items.length})
                </button>
                <button
                  onClick={() => setTypeFilter('lost')}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${typeFilter === 'lost' ? 'bg-amber-700 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}
                >
                  Lost
                </button>
                <button
                  onClick={() => setTypeFilter('found')}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${typeFilter === 'found' ? 'bg-emerald-700 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}
                >
                  Found
                </button>
              </div>

              <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Your Location ({currentUser.location.name})</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-600 ml-2"></span>
                <span>Lost Item</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600 ml-2"></span>
                <span>Found Item</span>
              </div>
            </div>

            {/* Interactive Leaflet Map */}
            <InteractiveMap
              items={filteredItems}
              userLocation={currentUser.location}
              center={[currentUser.location.lat, currentUser.location.lng]}
              zoom={15}
              heightClass="h-[600px]"
              showRadiusCircle={true}
              radiusKm={maxRadiusKm}
              onSelectItem={(item) => setSelectedItemForDetail(item)}
            />
          </div>
        )}

        {/* VIEW 3: RETURN MESSAGES */}
        {currentTab === 'messages' && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden min-h-[500px] flex flex-col md:flex-row transition-colors">
            {/* Left list of items with active conversations */}
            <div className="w-full md:w-80 border-r border-neutral-200 dark:border-neutral-800 p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-950/40">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Return Coordinations
                </h3>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Safe
                </span>
              </div>

              <div className="space-y-2">
                {items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setItemForChat(item)}
                    className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-xs cursor-pointer transition text-left space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-bold uppercase ${item.type === 'lost' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        {item.type}
                      </span>
                      <span className="text-neutral-400 dark:text-neutral-500 font-mono">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">{item.title}</h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">Contact: {item.reporterName}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Pane: Direct Chat Trigger */}
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">Secure Return Messenger</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
                  Click on any item to open the verified coordination chat with meeting location suggestions and handover confirmation.
                </p>
              </div>
              <button
                onClick={() => setItemForChat(items[1])}
                className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition cursor-pointer"
              >
                Open Active Return Chat (AirPods Handover)
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: MY REPORTS */}
        {currentTab === 'my-reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-display">
                  Reports by {currentUser.name}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Manage your posted items, inspect claimant evidence submissions, and review matches
                </p>
              </div>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Report</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items
                .filter(i => i.reporterId === currentUser.id)
                .map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    currentUser={currentUser}
                    onSelect={(selected) => setSelectedItemForDetail(selected)}
                    onOpenPrintFlyer={(it) => setItemForFlyer(it)}
                  />
                ))}
            </div>

            {items.filter(i => i.reporterId === currentUser.id).length === 0 && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center space-y-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  You haven't posted any items yet under this profile.
                </p>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Create Your First Report
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Demo Reset Button for testing */}
      <footer className="mt-auto py-6 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-500 dark:text-neutral-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 dark:text-neutral-100">Findr Hub</span>
            <span>·</span>
            <span>Zero-pill evidence verification & proximity return network</span>
          </div>

          <button
            onClick={() => {
              if (confirm('Reset demo items, messages, and claims to initial sample state?')) {
                StorageService.resetToDefault();
                reloadData();
                showToast('Sample data reset successfully');
              }
            }}
            className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Report Item Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentUser={currentUser}
        onItemCreated={(newItem, newMatches) => {
          reloadData();
          showToast(`Report for "${newItem.title}" published!`);
          if (newMatches.length > 0) {
            setTimeout(() => {
              showToast(`🎯 Proximity match detected nearby! Check notifications.`);
            }, 600);
          }
        }}
      />

      {/* 2. Item Detail Modal */}
      <ItemDetailModal
        item={selectedItemForDetail}
        currentUser={currentUser}
        allItems={items}
        isOpen={!!selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
        onOpenClaim={(item) => {
          setItemForClaim(item);
        }}
        onOpenChat={(item) => {
          setItemForChat(item);
        }}
        onSelectMatchItem={(matchItem) => {
          if (selectedItemForDetail) {
            const lost = selectedItemForDetail.type === 'lost' ? selectedItemForDetail : matchItem;
            const found = selectedItemForDetail.type === 'found' ? selectedItemForDetail : matchItem;
            setComparisonModalData({ lostItem: lost, foundItem: found });
          }
        }}
        onItemUpdated={reloadData}
        onOpenPrintFlyer={(it) => setItemForFlyer(it)}
      />

      {/* 3. Ownership Evidence Challenge Modal */}
      {itemForClaim && (
        <ClaimEvidenceModal
          item={itemForClaim}
          currentUser={currentUser}
          isOpen={!!itemForClaim}
          onClose={() => setItemForClaim(null)}
          onClaimSubmitted={() => {
            reloadData();
            showToast('Evidence submitted to finder for verification!');
          }}
        />
      )}

      {/* 4. Return Chat Modal */}
      {itemForChat && (
        <ReturnChatModal
          item={itemForChat}
          currentUser={currentUser}
          isOpen={!!itemForChat}
          onClose={() => setItemForChat(null)}
          onItemUpdated={reloadData}
        />
      )}

      {/* 5. Match Notifications Drawer */}
      <MatchNotificationsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        currentUser={currentUser}
        alerts={alerts}
        allItems={items}
        onSelectAlert={(alert) => {
          const lost = items.find(i => i.id === alert.lostItemId);
          const found = items.find(i => i.id === alert.foundItemId);
          if (lost && found) {
            setComparisonModalData({ lostItem: lost, foundItem: found });
            setIsAlertsDrawerOpen(false);
            StorageService.markAlertAsRead(alert.id);
            reloadData();
          }
        }}
        onMarkAllRead={() => {
          StorageService.markAllAlertsAsRead(currentUser.id);
          reloadData();
        }}
      />

      {/* 6. Match Comparison Modal */}
      {comparisonModalData && (
        <MatchComparisonModal
          lostItem={comparisonModalData.lostItem}
          foundItem={comparisonModalData.foundItem}
          currentUser={currentUser}
          isOpen={!!comparisonModalData}
          onClose={() => setComparisonModalData(null)}
          onClaimItem={(found) => {
            setComparisonModalData(null);
            setItemForClaim(found);
          }}
          onOpenChat={(item) => {
            setComparisonModalData(null);
            setItemForChat(item);
          }}
        />
      )}

      {/* 7. Gemini 3.8 Live API Voice Assistant Modal */}
      <LiveVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        userLocationName={currentUser.location.name}
      />

      {/* 8. Gemini Multi-turn Chatbot Modal (Search & Maps Grounding) */}
      <GeminiChatbotModal
        isOpen={isChatbotModalOpen}
        onClose={() => setIsChatbotModalOpen(false)}
        currentUser={currentUser}
      />

      {/* 9. Printable QR Code & Lost Flyer Modal */}
      <PrintableFlyerModal
        item={itemForFlyer}
        isOpen={!!itemForFlyer}
        onClose={() => setItemForFlyer(null)}
      />

      {/* 10. Automated Mock Email Notification Inbox & Preferences Modal */}
      <EmailInboxModal
        isOpen={isEmailInboxOpen}
        onClose={() => setIsEmailInboxOpen(false)}
        currentUser={currentUser}
        allItems={items}
        onViewItem={(itemId) => {
          const it = items.find(i => i.id === itemId);
          if (it) {
            setSelectedItemForDetail(it);
          }
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl border border-neutral-700 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
