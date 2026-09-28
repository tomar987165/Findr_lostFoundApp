import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  MapPin,
  Plus,
  MessageSquare,
  Compass,
  ShieldCheck,
  Mic,
  Bot,
  Mail,
  Sun,
  Moon,
  Bell,
  User as UserIcon,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { User, MatchAlert } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { UserProfileCard } from './UserProfileCard';
import { BadgeService } from '../services/badgeService';

interface HeaderProps {
  currentTab: 'items' | 'map' | 'messages' | 'my-reports';
  onTabChange: (tab: 'items' | 'map' | 'messages' | 'my-reports') => void;
  onOpenReport: () => void;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  alerts: MatchAlert[];
  onOpenAlerts: () => void;
  unreadCount: number;
  onOpenVoice: () => void;
  onOpenChatbot: () => void;
  onOpenEmailInbox: () => void;
  unreadEmailCount: number;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onRefreshLocation?: () => void;
  isLocating?: boolean;
  onOpenBadges?: () => void;
  onSimulateReunion?: () => void;
}

export function Header({
  currentTab,
  onTabChange,
  onOpenReport,
  currentUser,
  onSwitchUser,
  onOpenAlerts,
  unreadCount,
  onOpenVoice,
  onOpenChatbot,
  onOpenEmailInbox,
  unreadEmailCount,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onRefreshLocation,
  isLocating = false,
  onOpenBadges,
  onSimulateReunion,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        onCloseMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, onCloseMenu]);

  const totalNotifications = unreadCount + unreadEmailCount;

  const handleNavClick = (tab: 'items' | 'map' | 'messages' | 'my-reports') => {
    onTabChange(tab);
    onCloseMenu();
  };

  const handleAction = (actionFn: () => void) => {
    actionFn();
    onCloseMenu();
  };

  return (
    <header className="sticky top-0 z-[9990] bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 transition-colors overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 overflow-visible relative">
        {/* Brand Title & Active Persona Location */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onTabChange('items')}
            className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white font-display hover:opacity-80 transition cursor-pointer"
          >
            Findr
          </button>

          {/* Location indicator for current persona with GPS detect button */}
          <button
            type="button"
            onClick={onRefreshLocation}
            title={isLocating ? 'Detecting your real-time GPS location...' : 'Current location (click to detect real-time GPS)'}
            disabled={isLocating}
            className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer group"
          >
            <MapPin className={`w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform ${isLocating ? 'animate-pulse text-amber-500' : ''}`} />
            <span className="truncate max-w-[200px]">
              {isLocating ? 'Detecting GPS...' : currentUser.location.name}
            </span>
          </button>
        </div>

        {/* Right: Standalone Appearance Mode Toggle ON MAIN PAGE + Hamburger Menu Dropdown */}
        <div className="flex items-center gap-2 overflow-visible relative">
          {/* Top Bar Badge Indicator if user has unlocked achievements */}
          {(() => {
            const highestBadge = BadgeService.getHighestBadge(currentUser.returnsCompleted || 0);
            if (!highestBadge) return null;
            return (
              <button
                type="button"
                onClick={onOpenBadges}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer hover:scale-102 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 shadow-2xs"
                title={`Achievement Badge: ${highestBadge.name} (${currentUser.returnsCompleted || 0} Reunions). Click to view details.`}
              >
                <span className="text-amber-500 text-xs">
                  {highestBadge.name === 'Community Hero' ? '🏆' : highestBadge.name === 'Reliable Reporter' ? '🛡️' : '🌟'}
                </span>
                <span className="truncate max-w-[130px] font-display">{highestBadge.name}</span>
              </button>
            );
          })()}

          {/* Standalone main page appearance mode toggle icon */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl border border-neutral-300/80 dark:border-neutral-700 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700 hover:text-neutral-950 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Menu Button and Anchor Container */}
          <div className="relative overflow-visible">
            <button
              onClick={onToggleMenu}
              aria-expanded={isMenuOpen}
              aria-haspopup="dialog"
              aria-label="Toggle navigation menu"
              className="relative flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-xl font-medium text-xs transition cursor-pointer"
            >
              {isMenuOpen ? (
                <X className="w-4 h-4 text-neutral-800 dark:text-neutral-100" />
              ) : (
                <Menu className="w-4 h-4 text-neutral-800 dark:text-neutral-100" />
              )}
              <span className="font-semibold">{isMenuOpen ? 'Close' : 'Menu'}</span>

              {/* Unread indicator dot/badge when menu is closed */}
              {!isMenuOpen && totalNotifications > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
              )}
            </button>

            {/* Expanded Menu Dropdown Panel */}
            {isMenuOpen && (
              <>
                {/* Backdrop to close when clicking outside */}
                <div
                  onClick={onCloseMenu}
                  className="fixed inset-0 bg-neutral-950/20 dark:bg-neutral-950/40 backdrop-blur-2xs transition-opacity"
                  style={{ zIndex: 9998 }}
                  aria-hidden="true"
                />

                {/* Dropdown Container: absolute, high z-index, solid background, rounded corners, drop shadow */}
                <div
                  className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-5rem)] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100 transition-colors animate-in fade-in zoom-in-95 duration-150"
                  style={{ zIndex: 9999 }}
                  role="dialog"
                  aria-label="Menu and Navigation"
                >
                  {/* Dropdown Top Header */}
                  <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50 dark:bg-neutral-850">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white font-display">Menu & Navigation</span>
                      {totalNotifications > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full">
                          {totalNotifications}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={onCloseMenu}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
                      aria-label="Close menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dropdown Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-left">
                    {/* Persona / User Profile & Badge Card */}
                    <div className="space-y-2">
                      <UserProfileCard
                        user={currentUser}
                        variant="compact"
                        onOpenBadges={() => {
                          onCloseMenu();
                          onOpenBadges?.();
                        }}
                        onRefreshLocation={onRefreshLocation}
                        isLocating={isLocating}
                        onSimulateReunion={onSimulateReunion}
                      />

                      {/* Persona Switcher select */}
                      <div className="p-2.5 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
                        <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                          Switch Test Persona:
                        </label>
                        <select
                          value={currentUser.id}
                          onChange={(e) => {
                            const selected = DEMO_USERS.find(u => u.id === e.target.value);
                            if (selected) {
                              onSwitchUser(selected);
                            }
                          }}
                          className="w-full text-xs font-semibold bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg p-2 border border-neutral-300 dark:border-neutral-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
                        >
                          {DEMO_USERS.map((user) => {
                            const highest = BadgeService.getHighestBadge(user.returnsCompleted || 0);
                            const badgeTag = highest ? ` · 🏅 ${highest.name}` : '';
                            return (
                              <option key={user.id} value={user.id} className="dark:bg-neutral-900 dark:text-white">
                                👤 {user.name} ({user.returnsCompleted || 0} Reunions{badgeTag})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Primary Action Button: Report Item */}
                    <div>
                      <button
                        onClick={() => handleAction(onOpenReport)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.99] transition shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Report Lost or Found Item</span>
                      </button>
                    </div>

                    {/* Section: Main Navigation */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1 block">
                        Views & Navigation
                      </span>

                      <div className="space-y-1">
                        <button
                          onClick={() => handleNavClick('items')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            currentTab === 'items'
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                              : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Compass className="w-4 h-4" />
                            <span>Item Feed</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </button>

                        <button
                          onClick={() => handleNavClick('map')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            currentTab === 'map'
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                              : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <MapPin className="w-4 h-4" />
                            <span>Interactive Map</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </button>

                        <button
                          onClick={() => handleNavClick('messages')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            currentTab === 'messages'
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                              : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <MessageSquare className="w-4 h-4" />
                            <span>Return Chats</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </button>

                        <button
                          onClick={() => handleNavClick('my-reports')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            currentTab === 'my-reports'
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                              : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4" />
                            <span>My Reported Items</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      </div>
                    </div>

                    {/* Section: Notifications & Messaging */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1 block">
                        Alerts & Inbox
                      </span>

                      <div className="space-y-1">
                        {/* Match Alerts & Notifications */}
                        <button
                          onClick={() => handleAction(onOpenAlerts)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Bell className="w-4 h-4 text-rose-500" />
                            <span>Match Notifications</span>
                          </div>
                          {unreadCount > 0 ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-600 text-white rounded-full">
                              {unreadCount} new
                            </span>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                          )}
                        </button>

                        {/* Automated Email Inbox */}
                        <button
                          onClick={() => handleAction(onOpenEmailInbox)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Mail className="w-4 h-4 text-blue-500" />
                            <span>Email Alerts Inbox</span>
                          </div>
                          {unreadEmailCount > 0 ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-600 text-white rounded-full">
                              {unreadEmailCount} unread
                            </span>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Section: AI Assistants & Tools */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1 block flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Gemini AI Features</span>
                      </span>

                      <div className="space-y-1">
                        {/* Voice Live */}
                        <button
                          onClick={() => handleAction(onOpenVoice)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                              <Mic className="w-3.5 h-3.5 animate-pulse" />
                            </div>
                            <div className="text-left min-w-0">
                              <div className="font-semibold text-xs">Voice Live Call</div>
                              <div className="text-[10px] text-neutral-400 font-normal truncate">Gemini 3.8 Live real-time audio</div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        {/* AI Chatbot */}
                        <button
                          onClick={() => handleAction(onOpenChatbot)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left min-w-0">
                              <div className="font-semibold text-xs">AI Assistant Chatbot</div>
                              <div className="text-[10px] text-neutral-400 font-normal truncate">Search & Maps grounded multi-turn</div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Footer: Nested Appearance Switcher (Works Independently) */}
                  <div className="p-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 shrink-0">
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 transition cursor-pointer shadow-xs"
                      title="Switch between Light and Dark mode"
                    >
                      <div className="flex items-center gap-2.5">
                        {theme === 'dark' ? (
                          <Sun className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Moon className="w-4 h-4 text-neutral-700" />
                        )}
                        <span>Appearance Setting</span>
                      </div>
                      <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 capitalize">
                        {theme} Mode
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

