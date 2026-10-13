import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Inbox as InboxIcon,
  ListFilter,
  MoreHorizontal,
  Mail,
  Plus,
  Clock,
  Check,
  X,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowUpDown,
  Archive,
  Settings,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import type { KanbanColumnItem, KanbanCardItem } from '../pages/KanbanBoardPage';

export interface BoardInboxPanelProps {
  columns: KanbanColumnItem[];
  onClose: () => void;
  onCardClick: (card: KanbanCardItem, columnTitle: string) => void;
  onAddCard: (title: string) => void;
  onToggleCardCompletion?: (cardId: string, completed: boolean) => void;
  boardTitle?: string;
}

type InboxMenuPanel = 'main' | 'sort' | 'archived' | 'add_from' | 'background' | 'settings';
type InboxSortOption = 'newest' | 'oldest' | 'alphabetical' | 'due_date';

interface ArchivedInboxCard {
  id: string;
  title: string;
  columnTitle?: string;
  archivedAt: number;
}

const INBOX_BACKGROUNDS = [
  { id: 'navy', name: 'Navy Blue (Default)', value: '#0e2439', swatch: '#1e3a8a' },
  { id: 'slate', name: 'Deep Slate', value: '#091b2c', swatch: '#334155' },
  { id: 'charcoal', name: 'Charcoal Black', value: '#18181b', swatch: '#27272a' },
  { id: 'midnight', name: 'Midnight Indigo', value: '#1e1b4b', swatch: '#3730a3' },
  { id: 'emerald', name: 'Emerald Night', value: '#064e3b', swatch: '#047857' },
  { id: 'wine', name: 'Crimson Wine', value: '#4c0519', swatch: '#881337' },
  { id: 'cyan', name: 'Deep Cyan', value: '#083344', swatch: '#0e7490' },
];

export const BoardInboxPanel: React.FC<BoardInboxPanelProps> = ({
  columns,
  onClose,
  onCardClick,
  onAddCard,
  onToggleCardCompletion,
  boardTitle = 'Board',
}) => {
  const [inputText, setInputText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'due' | 'assigned'>('all');
  const [isConsolidateOpen, setIsConsolidateOpen] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Three-dot popover menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<InboxMenuPanel>('main');
  const [sortOption, setSortOption] = useState<InboxSortOption>('newest');
  const [compactView, setCompactView] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [inboxBg, setInboxBg] = useState<string>(() => {
    try {
      return localStorage.getItem('trello_inbox_bg') || '#0e2439';
    } catch {
      return '#0e2439';
    }
  });

  const [showCompleted, setShowCompleted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('trello_inbox_show_completed');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [archivedCards, setArchivedCards] = useState<ArchivedInboxCard[]>(() => {
    try {
      const saved = localStorage.getItem('trello_inbox_archived');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setMenuPanel('main');
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Toast auto-hide
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleSetInboxBg = (color: string, name: string) => {
    setInboxBg(color);
    try {
      localStorage.setItem('trello_inbox_bg', color);
    } catch {}
    showToast(`Background set to ${name}`);
  };

  const handleToggleShowCompleted = () => {
    const next = !showCompleted;
    setShowCompleted(next);
    try {
      localStorage.setItem('trello_inbox_show_completed', JSON.stringify(next));
    } catch {}
    showToast(next ? 'Showing completed cards' : 'Hiding completed cards');
  };

  const handleArchiveCard = (card: KanbanCardItem, colTitle?: string) => {
    const item: ArchivedInboxCard = {
      id: card.id,
      title: card.title,
      columnTitle: colTitle,
      archivedAt: Date.now(),
    };
    const updated = [item, ...archivedCards];
    setArchivedCards(updated);
    try {
      localStorage.setItem('trello_inbox_archived', JSON.stringify(updated));
    } catch {}
    showToast(`Archived "${card.title}"`);
  };

  const handleRestoreCard = (item: ArchivedInboxCard) => {
    onAddCard(item.title);
    const updated = archivedCards.filter((c) => c.id !== item.id);
    setArchivedCards(updated);
    try {
      localStorage.setItem('trello_inbox_archived', JSON.stringify(updated));
    } catch {}
    showToast(`Restored "${item.title}" to Inbox`);
  };

  const handleAddFromColumn = (col: KanbanColumnItem) => {
    if (col.cards.length === 0) {
      showToast(`No cards found in ${col.title}`);
      return;
    }
    // Add starter reference for top card
    const firstCard = col.cards[0];
    onAddCard(firstCard.title);
    showToast(`Added "${firstCard.title}" from ${col.title}`);
    setIsMenuOpen(false);
  };

  // Flatten cards from columns
  const allCards = useMemo(() => {
    return columns.flatMap((col) =>
      col.cards.map((c) => ({
        ...c,
        columnTitle: col.title,
        columnId: col.id,
      }))
    );
  }, [columns]);

  // Filtered and sorted cards
  const displayedCards = useMemo(() => {
    let list = [...allCards];

    // Exclude completed if toggled off
    if (!showCompleted) {
      list = list.filter((c) => !c.completed);
    }

    // Active filter tab
    if (activeFilter === 'due') {
      list = list.filter((c) => c.dueDate);
    } else if (activeFilter === 'assigned') {
      list = list.filter((c) => c.assignees && c.assignees.length > 0);
    }

    // Sorting
    switch (sortOption) {
      case 'newest':
        return list;
      case 'oldest':
        return [...list].reverse();
      case 'alphabetical':
        return [...list].sort((a, b) => a.title.localeCompare(b.title));
      case 'due_date':
        return [...list].sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
      default:
        return list;
    }
  }, [allCards, activeFilter, showCompleted, sortOption]);

  const handleAdd = () => {
    if (!inputText.trim()) return;
    onAddCard(inputText.trim());
    setInputText('');
  };

  return (
    <div
      style={{ backgroundColor: inboxBg }}
      className="h-full flex flex-col rounded-2xl border border-white/10 text-white shadow-2xl overflow-hidden select-none relative transition-colors duration-300"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-[#1d2125]/95 text-white px-3 py-1.5 rounded-lg border border-white/20 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in duration-150 flex items-center gap-1.5 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-black/20 backdrop-blur-sm relative z-30">
        {/* Left: Inbox Title */}
        <div className="flex items-center gap-2">
          <InboxIcon className="h-4 w-4 text-blue-400 shrink-0" />
          <span className="text-sm font-bold text-white tracking-wide">Inbox</span>
        </div>

        {/* Right: Filter, More & Close */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`rounded-lg p-1.5 transition cursor-pointer ${
              showFilterBar ? 'bg-blue-600/30 text-blue-400' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title="Filter cards"
          >
            <ListFilter className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              setMenuPanel('main');
            }}
            className={`rounded-lg p-1.5 transition cursor-pointer ${
              isMenuOpen ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title="Inbox menu"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close Inbox"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Three-Dot Popover Menu (Quasha-Style) */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute right-2 top-11 z-50 w-64 bg-[#282e33] border border-white/15 rounded-xl shadow-2xl p-2 text-white animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md"
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/10 px-1">
            {menuPanel !== 'main' ? (
              <button
                type="button"
                onClick={() => setMenuPanel('main')}
                className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Back to menu"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-6" />
            )}

            <h4 className="text-xs font-bold text-white tracking-wide text-center flex-1">
              {menuPanel === 'main' && 'Menu'}
              {menuPanel === 'sort' && 'Sort'}
              {menuPanel === 'archived' && 'Archived cards'}
              {menuPanel === 'add_from' && 'Add from list'}
              {menuPanel === 'background' && 'Change background'}
              {menuPanel === 'settings' && 'Settings'}
            </h4>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setMenuPanel('main');
              }}
              className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Close menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* PANEL 1: MAIN MENU */}
          {menuPanel === 'main' && (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setMenuPanel('sort')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/10 transition cursor-pointer text-left text-xs text-white/90 group"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowUpDown className="w-4 h-4 text-white/70 group-hover:text-white" />
                  <span>Sort</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              <button
                type="button"
                onClick={() => setMenuPanel('archived')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/10 transition cursor-pointer text-left text-xs text-white/90 group"
              >
                <div className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4 text-white/70 group-hover:text-white" />
                  <span>View archived cards</span>
                </div>
                {archivedCards.length > 0 && (
                  <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.2 rounded-full font-semibold">
                    {archivedCards.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMenuPanel('add_from')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/10 transition cursor-pointer text-left text-xs text-white/90 group"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-white/70 group-hover:text-white" />
                  <span>Add from</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              <button
                type="button"
                onClick={() => setMenuPanel('background')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/10 transition cursor-pointer text-left text-xs text-white/90 group"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded bg-blue-500 shrink-0 shadow-sm border border-white/20"
                    style={{ backgroundColor: inboxBg }}
                  />
                  <span>Change background</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              <button
                type="button"
                onClick={() => setMenuPanel('settings')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/10 transition cursor-pointer text-left text-xs text-white/90 group"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-white/70 group-hover:text-white" />
                  <span>Settings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              <div className="my-1 border-t border-white/10" />

              <button
                type="button"
                onClick={() => {
                  window.open('/dashboard?section=home', '_blank');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/10 transition cursor-pointer text-left text-xs text-white/90 group"
              >
                <ExternalLink className="w-4 h-4 text-white/70 group-hover:text-white" />
                <span>Open in new tab</span>
              </button>
            </div>
          )}

          {/* PANEL 2: SORT */}
          {menuPanel === 'sort' && (
            <div className="space-y-1 py-1">
              {[
                { id: 'newest' as const, label: 'Date created (newest first)' },
                { id: 'oldest' as const, label: 'Date created (oldest first)' },
                { id: 'alphabetical' as const, label: 'Card title (alphabetical A-Z)' },
                { id: 'due_date' as const, label: 'Due date (soonest first)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSortOption(opt.id);
                    showToast(`Sorted by ${opt.label}`);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer text-left ${
                    sortOption === opt.id
                      ? 'bg-blue-600/30 text-blue-400 font-semibold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortOption === opt.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          )}

          {/* PANEL 3: ARCHIVED CARDS */}
          {menuPanel === 'archived' && (
            <div className="space-y-2 py-1 max-h-60 overflow-y-auto custom-scrollbar">
              {archivedCards.length > 0 ? (
                archivedCards.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{item.title}</p>
                      {item.columnTitle && (
                        <span className="text-[10px] text-white/40">{item.columnTitle}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreCard(item)}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-blue-400 hover:text-white text-[10px] font-semibold transition cursor-pointer shrink-0 flex items-center gap-1"
                      title="Restore card to Inbox"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-white/50 space-y-1.5">
                  <Archive className="w-6 h-6 mx-auto text-white/30" />
                  <p className="text-xs">No archived cards in Inbox</p>
                </div>
              )}
            </div>
          )}

          {/* PANEL 4: ADD FROM LIST */}
          {menuPanel === 'add_from' && (
            <div className="space-y-1.5 py-1">
              <p className="text-[11px] text-white/50 px-1 mb-1">
                Copy cards from {boardTitle}'s lists into your inbox:
              </p>
              <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                {columns.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleAddFromColumn(col)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition cursor-pointer text-left text-xs text-white/90 group border border-white/5"
                  >
                    <span className="font-medium group-hover:text-blue-300 transition truncate">
                      {col.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/60 font-semibold shrink-0">
                      {col.cards.length} cards
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PANEL 5: CHANGE BACKGROUND */}
          {menuPanel === 'background' && (
            <div className="space-y-1.5 py-1">
              <p className="text-[11px] text-white/50 px-1 mb-1">
                Select an authentic Quasha background theme for your inbox:
              </p>
              <div className="grid grid-cols-1 gap-1">
                {INBOX_BACKGROUNDS.map((bg) => {
                  const isSelected = inboxBg === bg.value;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => handleSetInboxBg(bg.value, bg.name)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition cursor-pointer text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-5 h-5 rounded-md border border-white/20 shadow-xs shrink-0"
                          style={{ backgroundColor: bg.value }}
                        />
                        <span className="text-xs font-medium text-white">{bg.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PANEL 6: SETTINGS */}
          {menuPanel === 'settings' && (
            <div className="space-y-2 py-1">
              <div className="p-2 rounded-lg bg-black/20 border border-white/5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-white">Show completed cards</p>
                    <p className="text-[10px] text-white/50">Display struck-through completed tasks</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleShowCompleted}
                    className={`w-9 h-5 rounded-full transition-colors cursor-pointer p-0.5 ${
                      showCompleted ? 'bg-blue-600' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        showCompleted ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <div>
                    <p className="text-xs font-medium text-white">Compact card view</p>
                    <p className="text-[10px] text-white/50">Reduce card padding for dense layout</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCompactView(!compactView);
                      showToast(!compactView ? 'Compact view enabled' : 'Normal view enabled');
                    }}
                    className={`w-9 h-5 rounded-full transition-colors cursor-pointer p-0.5 ${
                      compactView ? 'bg-blue-600' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        compactView ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden space-y-2.5">
        {/* Add a card input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Add a card"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition shadow-inner"
          />
          {inputText.trim() && (
            <button
              type="button"
              onClick={handleAdd}
              className="absolute right-1.5 top-1.5 rounded-lg bg-[#0052cc] hover:bg-blue-600 text-white p-1 transition cursor-pointer shadow-sm"
              title="Add card"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Optional Filter Tabs Bar */}
        {showFilterBar && (
          <div className="flex items-center rounded-lg bg-black/30 p-0.5 border border-white/10 text-[11px] animate-in fade-in duration-150 shrink-0">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-1 rounded-md transition font-medium ${
                activeFilter === 'all'
                  ? 'bg-[#0052cc] text-white shadow font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              All ({allCards.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('due')}
              className={`flex-1 py-1 rounded-md transition font-medium ${
                activeFilter === 'due'
                  ? 'bg-[#0052cc] text-white shadow font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Due Soon
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('assigned')}
              className={`flex-1 py-1 rounded-md transition font-medium ${
                activeFilter === 'assigned'
                  ? 'bg-[#0052cc] text-white shadow font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Assigned
            </button>
          </div>
        )}

        {/* Empty State or Cards Feed */}
        {displayedCards.length === 0 ? (
          <div className="flex-1 flex flex-col justify-start pt-3 px-2 text-white/60">
            <p className="text-xs mb-2">See it, send it, save it for later</p>
            <Mail className="h-4 w-4 text-white/40" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-0.5">
            {displayedCards.map((card) => (
              <div
                key={card.id}
                onClick={() => onCardClick(card, card.columnTitle)}
                className={`group rounded-xl border border-white/10 bg-black/25 hover:bg-black/40 transition cursor-pointer shadow-sm hover:border-white/25 relative ${
                  compactView ? 'p-2' : 'p-2.5'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[10px] mb-1">
                  <span className="rounded bg-white/10 px-1.5 py-0.2 font-bold uppercase text-white/70">
                    {card.columnTitle}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {card.dueDate && (
                      <span className="flex items-center gap-1 text-amber-300">
                        <Clock className="h-2.5 w-2.5" />
                        {card.dueDate}
                      </span>
                    )}
                    {/* Hover Archive Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveCard(card, card.columnTitle);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-white/40 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer"
                      title="Archive card"
                    >
                      <Archive className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-xs font-medium leading-snug ${
                      card.completed ? 'text-white/40 line-through' : 'text-white'
                    }`}
                  >
                    {card.title}
                  </p>
                  {onToggleCardCompletion && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCardCompletion(card.id, !card.completed);
                      }}
                      className={`p-0.5 rounded transition cursor-pointer shrink-0 ${
                        card.completed
                          ? 'text-emerald-400'
                          : 'text-white/20 hover:text-white'
                      }`}
                      title={card.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom: Consolidate your to-dos ^ */}
      <div className="p-2.5 border-t border-white/10 bg-black/20 backdrop-blur-sm relative z-20">
        <button
          type="button"
          onClick={() => setIsConsolidateOpen(!isConsolidateOpen)}
          className="w-full flex items-center justify-between rounded-full bg-white/5 hover:bg-white/10 px-3 py-1.5 text-[11px] text-white/80 transition cursor-pointer border border-white/10 shadow-sm"
        >
          <div className="flex items-center gap-2">
            {/* App mini icons */}
            <div className="flex -space-x-1 items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500 text-[7px] font-bold text-white flex items-center justify-center border border-[#091b2c]">
                M
              </div>
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 text-[7px] font-bold text-white flex items-center justify-center border border-[#091b2c]">
                O
              </div>
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-[7px] font-bold text-white flex items-center justify-center border border-[#091b2c]">
                S
              </div>
              <div className="w-3.5 h-3.5 rounded-full bg-amber-500 text-[7px] font-bold text-white flex items-center justify-center border border-[#091b2c]">
                C
              </div>
            </div>
            <span className="font-medium text-white/90">Consolidate your to-dos</span>
          </div>
          <ChevronUp
            className={`h-3 w-3 text-white/60 transition-transform duration-200 ${
              isConsolidateOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isConsolidateOpen && (
          <div className="mt-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white/70 space-y-1.5 animate-in fade-in duration-150">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" /> Bring all your work into Quasha
            </p>
            <p className="text-[10px] text-white/60 leading-relaxed">
              Forward emails from Gmail/Outlook or send Slack messages directly to this board's inbox.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardInboxPanel;
