// src/components/GlobalSearchModal.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Kanban,
  CheckSquare,
  Layers,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { boardService, type Board } from '../services/boardService';
import type { KanbanColumnItem, KanbanCardItem, CardTag } from '../pages/KanbanBoardPage';

export interface GlobalSearchResultItem {
  id: string;
  type: 'card' | 'board' | 'list';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  boardId?: string;
  listId?: string;
  cardData?: KanbanCardItem;
  columnTitle?: string;
  tags?: CardTag[];
  dueDate?: string;
  completed?: boolean;
}

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoardId?: string;
  columns?: KanbanColumnItem[];
  onSelectCard?: (card: KanbanCardItem, columnTitle: string) => void;
  onSelectList?: (listId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  currentBoardId,
  columns = [],
  onSelectCard,
  onSelectList,
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'cards' | 'boards' | 'lists'>('all');
  const [allBoards, setAllBoards] = useState<Board[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch all boards for cross-board search
  useEffect(() => {
    if (isOpen) {
      boardService
        .getBoards()
        .then((b) => setAllBoards(b || []))
        .catch(() => setAllBoards([]));
      
      // Auto-focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Compute search results based on query and active board/lists/cards
  const searchResults: GlobalSearchResultItem[] = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const results: GlobalSearchResultItem[] = [];

    // 1. Cards (from current board columns)
    columns.forEach((col) => {
      col.cards.forEach((card) => {
        const matchesTitle = card.title.toLowerCase().includes(trimmed);
        const matchesDesc = card.description?.toLowerCase().includes(trimmed);
        const matchesTags = card.tags?.some((t) => t.label.toLowerCase().includes(trimmed));
        const matchesCol = col.title.toLowerCase().includes(trimmed);

        if (!trimmed || matchesTitle || matchesDesc || matchesTags || matchesCol) {
          results.push({
            id: `card-${card.id}`,
            type: 'card',
            title: card.title,
            subtitle: `in ${col.title}`,
            boardId: currentBoardId,
            listId: col.id,
            cardData: card,
            columnTitle: col.title,
            tags: card.tags,
            dueDate: card.dueDate,
            completed: card.completed,
          });
        }
      });
    });

    // 2. Lists (from current board columns)
    columns.forEach((col) => {
      if (!trimmed || col.title.toLowerCase().includes(trimmed)) {
        results.push({
          id: `list-${col.id}`,
          type: 'list',
          title: col.title,
          subtitle: `${col.cards.length} card${col.cards.length === 1 ? '' : 's'}`,
          boardId: currentBoardId,
          listId: col.id,
        });
      }
    });

    // 3. Boards
    allBoards.forEach((board) => {
      const matchesTitle = board.title.toLowerCase().includes(trimmed);
      const matchesDesc = board.description?.toLowerCase().includes(trimmed);

      if (!trimmed || matchesTitle || matchesDesc) {
        results.push({
          id: `board-${board.id}`,
          type: 'board',
          title: board.title,
          subtitle: board.description || (board.id === currentBoardId ? 'Current board' : 'Board'),
          badge: board.id === currentBoardId ? 'Active' : undefined,
          badgeColor: 'blue',
          boardId: board.id,
        });
      }
    });

    // Filter by tab
    let filtered = results;
    if (activeTab === 'cards') {
      filtered = results.filter((r) => r.type === 'card');
    } else if (activeTab === 'boards') {
      filtered = results.filter((r) => r.type === 'board');
    } else if (activeTab === 'lists') {
      filtered = results.filter((r) => r.type === 'list');
    }

    return filtered;
  }, [query, columns, allBoards, currentBoardId, activeTab]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeTab]);

  const handleSelectItem = (item: GlobalSearchResultItem) => {
    if (item.type === 'card') {
      if (item.cardData && item.columnTitle && onSelectCard) {
        onSelectCard(item.cardData, item.columnTitle);
      } else if (item.boardId) {
        navigate(`/board/${item.boardId}`);
      }
      onClose();
    } else if (item.type === 'board' && item.boardId) {
      navigate(`/board/${item.boardId}`);
      onClose();
    } else if (item.type === 'list' && item.listId) {
      if (onSelectList) {
        onSelectList(item.listId);
      } else {
        const el = document.getElementById(`column-${item.listId}`);
        el?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
      onClose();
    }
  };

  // Keyboard navigation inside search dialog
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (searchResults.length > 0 ? (prev + 1) % searchResults.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        searchResults.length > 0 ? (prev - 1 + searchResults.length) % searchResults.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectItem(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-white/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search cards, lists, boards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/50">
            ESC
          </kbd>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5 bg-black/20 text-xs overflow-x-auto">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'cards', label: `Cards (${columns.reduce((a, c) => a + c.cards.length, 0)})` },
            { id: 'lists', label: `Lists (${columns.length})` },
            { id: 'boards', label: `Boards (${allBoards.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-white/20 mx-auto" />
              <p className="text-sm font-semibold text-white/70">No matching results</p>
              <p className="text-xs text-white/40 max-w-sm mx-auto">
                {query ? `We couldn't find anything matching "${query}".` : 'Start typing to search cards, lists, and boards.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20'
                        : 'hover:bg-white/5 text-white/90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : item.type === 'card'
                            ? 'bg-blue-500/20 text-emerald-400 border border-blue-500/30'
                            : item.type === 'list'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {item.type === 'card' && <CheckSquare className="w-4 h-4" />}
                        {item.type === 'list' && <Layers className="w-4 h-4" />}
                        {item.type === 'board' && <Kanban className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold truncate">{item.title}</p>
                          {item.completed && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              Completed
                            </span>
                          )}
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] opacity-70 truncate">
                          {item.subtitle && <span>{item.subtitle}</span>}
                          {item.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {item.dueDate}
                            </span>
                          )}
                        </div>

                        {/* Card tags preview */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag.id}
                                className={`h-1.5 w-6 rounded-full ${tag.colorClass || 'bg-blue-500'}`}
                                title={tag.label}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-white/50 border border-white/5'
                        }`}
                      >
                        {item.type}
                      </span>
                      <ArrowRight
                        className={`w-3.5 h-3.5 transition ${
                          isSelected ? 'text-white translate-x-0.5' : 'text-white/30'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-white/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px]">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px]">ESC</kbd>
              Close
            </span>
          </div>
          <span className="hidden sm:inline text-white/40">
            {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
