import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Kanban,
  Search,
  Plus,
  Bell,
  HelpCircle,
  ChevronDown,
  Menu,
  User as UserIcon,
  Settings,
  LogOut,
} from 'lucide-react';
import { logout } from '../services/auth';
import type { Workspace } from '../services/workspaceService';
import { RecentBoardsPopover } from './RecentBoardsPopover';
import { StarredBoardsPopover } from './StarredBoardsPopover';
import GlobalSearchModal from './GlobalSearchModal';
import NotificationsPopover from './NotificationsPopover';
import HelpModal from './HelpModal';

export interface NavbarProps {
  onMobileMenuToggle?: () => void;
  onCreateClick?: () => void;
  userName?: string;
  userEmail?: string;
  workspaces?: Workspace[];
  activeWorkspace?: Workspace | null;
  onSelectWorkspace?: (workspace: Workspace) => void;
  onCreateWorkspaceClick?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onWorkspaceSettingsClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMobileMenuToggle,
  onCreateClick,
  userName = 'User',
  userEmail = '',
  workspaces = [],
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspaceClick,
  onProfileClick,
  onSettingsClick,
  onWorkspaceSettingsClick,
}) => {
  const navigate = useNavigate();
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [isStarredOpen, setIsStarredOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      } else if (!isInput && e.key === '?') {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);
  const starredRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) {
        setIsRecentOpen(false);
      }
      if (starredRef.current && !starredRef.current.contains(e.target as Node)) {
        setIsStarredOpen(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const userInitials = userName
    ? userName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-zinc-950/90 border-b border-white/10 backdrop-blur-xl px-4 flex items-center justify-between text-white select-none">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 group transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-[#0052cc] text-white flex items-center justify-center shadow-md shadow-blue-600/30">
            <Kanban className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white/90 group-hover:text-white hidden sm:inline-block">
            Trello
          </span>
        </Link>

        {/* Workspaces Menu */}
        <div ref={workspaceRef} className="relative hidden md:block">
          <button
            type="button"
            onClick={() => {
              setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen);
              setIsRecentOpen(false);
              setIsStarredOpen(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              isWorkspaceMenuOpen ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>{activeWorkspace?.name || 'Workspaces'}</span>
            <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isWorkspaceMenuOpen && (
            <div
              className="absolute left-0 mt-2 w-64 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-2xl z-50 animate-in fade-in space-y-2"
              onMouseLeave={() => setIsWorkspaceMenuOpen(false)}
            >
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  Your Workspaces
                </span>
                {onCreateWorkspaceClick && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      onCreateWorkspaceClick();
                    }}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-white transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                )}
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto">
                {workspaces && workspaces.length > 0 ? (
                  workspaces.map((ws) => {
                    const isSelected = activeWorkspace?.id === ws.id;
                    const initial = ws.name.trim().slice(0, 2).toUpperCase();
                    return (
                      <div
                        key={ws.id}
                        onClick={() => {
                          if (onSelectWorkspace) onSelectWorkspace(ws);
                          navigate('/dashboard');
                          setIsWorkspaceMenuOpen(false);
                        }}
                        className={`flex items-center gap-2.5 rounded-lg p-2 cursor-pointer transition ${
                          isSelected ? 'bg-[#0052cc]/20 text-white border border-[#0052cc]/30' : 'hover:bg-white/5 text-white/80'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-md ${
                            isSelected ? 'bg-[#0052cc]' : 'bg-zinc-800 border border-white/10'
                          } text-white font-bold text-xs flex items-center justify-center shrink-0`}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate text-white">{ws.name}</div>
                          <div className="text-[10px] text-emerald-400">Active Workspace</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-2 text-xs text-white/40 italic">
                    No workspaces found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent Dropdown */}
        <div ref={recentRef} className="relative hidden md:block">
          <button
            type="button"
            onClick={() => {
              setIsRecentOpen(!isRecentOpen);
              setIsStarredOpen(false);
              setIsWorkspaceMenuOpen(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              isRecentOpen ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>Recent</span>
            <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${isRecentOpen ? 'rotate-180' : ''}`} />
          </button>
          <RecentBoardsPopover
            isOpen={isRecentOpen}
            onClose={() => setIsRecentOpen(false)}
            workspaceName={activeWorkspace?.name}
          />
        </div>

        {/* Starred Dropdown */}
        <div ref={starredRef} className="relative hidden md:block">
          <button
            type="button"
            onClick={() => {
              setIsStarredOpen(!isStarredOpen);
              setIsRecentOpen(false);
              setIsWorkspaceMenuOpen(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              isStarredOpen ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>Starred</span>
            <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${isStarredOpen ? 'rotate-180' : ''}`} />
          </button>
          <StarredBoardsPopover
            isOpen={isStarredOpen}
            onClose={() => setIsStarredOpen(false)}
          />
        </div>

        {/* Create Action Button */}
        <button
          type="button"
          onClick={onCreateClick}
          className="flex items-center gap-1 bg-[#0052cc] hover:bg-blue-600 active:bg-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold text-white shadow-sm transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create</span>
        </button>
      </div>

      {/* Center Search Bar */}
      <div className="hidden sm:flex flex-1 max-w-sm mx-4">
        <button
          type="button"
          onClick={() => setIsGlobalSearchOpen(true)}
          className="relative w-full text-left cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-white/70 transition" />
          <div className="w-full h-8 pl-9 pr-14 rounded-lg bg-white/10 border border-white/10 text-xs text-white/50 group-hover:bg-white/15 group-hover:border-white/25 flex items-center transition">
            Search cards, boards, lists...
          </div>
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-black/40 border border-white/15 px-1.5 py-0.5 text-[9px] font-semibold text-white/50 group-hover:text-white/70">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              setIsHelpOpen(false);
              setIsProfileMenuOpen(false);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
              isNotificationsOpen
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 bg-rose-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white ring-2 ring-zinc-950">
              {unreadNotificationsCount}
            </span>
          )}

          <NotificationsPopover
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onUnreadCountChange={(count) => setUnreadNotificationsCount(count)}
          />
        </div>

        {/* Help & Shortcuts (?) */}
        <button
          type="button"
          onClick={() => {
            setIsHelpOpen(true);
            setIsNotificationsOpen(false);
            setIsProfileMenuOpen(false);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
            isHelpOpen
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
          title="Help & Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Profile menu */}
        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center rounded-full ring-2 ring-white/20 hover:ring-white/40 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#0052cc] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {userInitials}
            </div>
          </button>

          {isProfileMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-2xl z-50 animate-in fade-in text-white"
              onMouseLeave={() => setIsProfileMenuOpen(false)}
            >
              <div className="px-3 py-2 border-b border-white/10">
                <p className="text-xs font-semibold text-white">{userName}</p>
                <p className="text-[10px] text-white/50 truncate">{userEmail}</p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onProfileClick) {
                      onProfileClick();
                    } else {
                      navigate('/dashboard');
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/5 hover:text-white transition text-left cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Profile & Visibility</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onSettingsClick) {
                      onSettingsClick();
                    } else if (onWorkspaceSettingsClick) {
                      onWorkspaceSettingsClick();
                    } else {
                      navigate('/dashboard');
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/5 hover:text-white transition text-left cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>
              </div>

              <div className="pt-1 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </header>
  );
};

export default Navbar;
