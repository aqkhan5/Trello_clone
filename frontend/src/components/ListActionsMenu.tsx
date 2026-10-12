import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { KanbanColumnItem } from '../pages/KanbanBoardPage';

export type ListMenuPanel =
  | 'main'
  | 'copy'
  | 'move'
  | 'move-all-cards'
  | 'sort'
  | 'color'
  | 'automation-rule';

export interface ListActionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  column: KanbanColumnItem;
  allColumns: KanbanColumnItem[];
  onAddCard: (columnId: string) => void;
  onCopyList: (columnId: string, newTitle: string) => void;
  onMoveList: (columnId: string, targetPosition: number) => void;
  onMoveAllCards: (sourceColumnId: string, targetColumnId: string) => void;
  onSortCards: (
    columnId: string,
    sortBy: 'newest' | 'oldest' | 'alpha' | 'due_date'
  ) => void;
  onTogglePinList: (columnId: string) => void;
  isPinned?: boolean;
  onToggleWatchList: (columnId: string) => void;
  isWatched?: boolean;
  listColor?: string | null;
  onChangeListColor: (columnId: string, color: string | null) => void;
  onArchiveList: (columnId: string) => void;
  onArchiveAllCards: (columnId: string) => void;
}

export const LIST_COLOR_PRESETS = [
  { id: 'default', name: 'Default', hex: null, class: 'bg-[#22272b] border-[#384148]' },
  { id: 'blue', name: 'Ocean Blue', hex: '#2563eb', class: 'bg-blue-600' },
  { id: 'emerald', name: 'Emerald Green', hex: '#059669', class: 'bg-emerald-600' },
  { id: 'purple', name: 'Royal Purple', hex: '#7c3aed', class: 'bg-purple-600' },
  { id: 'amber', name: 'Warm Amber', hex: '#d97706', class: 'bg-amber-600' },
  { id: 'crimson', name: 'Crimson Red', hex: '#dc2626', class: 'bg-rose-600' },
  { id: 'cyan', name: 'Teal Cyan', hex: '#0891b2', class: 'bg-cyan-600' },
  { id: 'rose', name: 'Vibrant Pink', hex: '#db2777', class: 'bg-pink-600' },
  { id: 'indigo', name: 'Deep Indigo', hex: '#4f46e5', class: 'bg-indigo-600' },
  { id: 'slate', name: 'Slate Gray', hex: '#475569', class: 'bg-slate-600' },
];

export const ListActionsMenu: React.FC<ListActionsMenuProps> = ({
  isOpen,
  onClose,
  anchorEl,
  column,
  allColumns,
  onAddCard,
  onCopyList,
  onMoveList,
  onMoveAllCards,
  onSortCards,
  onTogglePinList,
  isPinned = false,
  onToggleWatchList,
  isWatched = false,
  listColor = null,
  onChangeListColor,
  onArchiveList,
  onArchiveAllCards,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState<ListMenuPanel>('main');
  const [copyTitle, setCopyTitle] = useState(`Copy of ${column.title}`);
  const [isAutomationOpen, setIsAutomationOpen] = useState(true);
  const [activeAutomationRule, setActiveAutomationRule] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; maxHeight: number }>({
    top: 80,
    left: 100,
    maxHeight: 520,
  });

  // Other columns available for moving cards
  const otherColumns = allColumns.filter((c) => c.id !== column.id);

  // Reset to main panel whenever menu is opened
  useEffect(() => {
    if (isOpen) {
      setActivePanel('main');
      setCopyTitle(`Copy of ${column.title}`);
    }
  }, [isOpen, column.title]);

  // Dynamic positioning calculation anchored to trigger button
  useEffect(() => {
    if (!isOpen) return;

    const updateCoords = () => {
      if (!anchorEl) return;
      const rect = anchorEl.getBoundingClientRect();
      const menuWidth = 280;
      const margin = 8;

      // In Trello (Image 1):
      // The popover starts around rect.left (or rect.right) and floats outwards.
      // If there's room on the right, position starting at rect.left:
      let left = rect.left;
      if (left + menuWidth > window.innerWidth - margin) {
        // Not enough room on the right; anchor to the right edge of trigger button
        left = Math.max(margin, rect.right - menuWidth);
      }
      if (left < margin) {
        left = margin;
      }

      // Vertical position:
      let top = rect.bottom + 6;
      let maxHeight = window.innerHeight - top - margin;

      // If bottom space is constrained (< 260px) and top space is larger:
      if (maxHeight < 260 && rect.top > maxHeight) {
        const topMaxHeight = Math.min(rect.top - margin * 2, 540);
        top = Math.max(margin, rect.top - topMaxHeight - 6);
        maxHeight = topMaxHeight;
      } else {
        maxHeight = Math.min(maxHeight, 560);
      }

      setCoords({ top, left, maxHeight });
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen, anchorEl]);

  // Click outside and Esc listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        anchorEl &&
        !anchorEl.contains(target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen) return null;

  const handleCopySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyTitle.trim()) return;
    onCopyList(column.id, copyTitle.trim());
    onClose();
  };

  const handleMoveSubmit = (newIndex: number) => {
    onMoveList(column.id, newIndex);
    onClose();
  };

  const handleMoveAllSubmit = (targetColId: string) => {
    onMoveAllCards(column.id, targetColId);
    onClose();
  };

  const handleSortSubmit = (
    sortBy: 'newest' | 'oldest' | 'alpha' | 'due_date'
  ) => {
    onSortCards(column.id, sortBy);
    onClose();
  };

  return createPortal(
    <div
      ref={menuRef}
      data-list-menu="true"
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        maxHeight: `${coords.maxHeight}px`,
        zIndex: 99999,
      }}
      className="w-[280px] flex flex-col rounded-xl border border-[#384148] bg-[#22272b] text-[#b6c2cf] shadow-2xl animate-in fade-in zoom-in-95 select-none overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ----------------- PANEL: MAIN ----------------- */}
      {activePanel === 'main' && (
        <div className="flex flex-col min-h-0">
          {/* Header */}
          <div className="relative flex items-center justify-center px-4 py-2.5 border-b border-[#384148] shrink-0">
            <span className="text-xs font-semibold text-[#9fadbc]">List actions</span>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-2 top-2 p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body List */}
          <div className="p-1.5 overflow-y-auto space-y-0.5 custom-scrollbar flex-1">
            {/* Add card */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddCard(column.id);
              }}
              className="w-full text-left px-3 py-1.5 text-[13.5px] text-[#b6c2cf] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer flex items-center justify-between"
            >
              <span>Add card</span>
            </button>

            {/* Copy list */}
            <button
              type="button"
              onClick={() => {
                setCopyTitle(`Copy of ${column.title}`);
                setActivePanel('copy');
              }}
              className="w-full text-left px-3 py-1.5 text-[13.5px] text-[#b6c2cf] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer flex items-center justify-between"
            >
              <span>Copy list</span>
            </button>

            {/* Move list */}
            <button
              type="button"
              onClick={() => setActivePanel('move')}
              className="w-full text-left px-3 py-1.5 text-[13.5px] text-[#b6c2cf] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer flex items-center justify-between"
            >
              <span>Move list</span>
            </button>

            {/* Move all cards in this list */}
            <button
              type="button"
              onClick={() => setActivePanel('move-all-cards')}
              disabled={column.cards.length === 0}
              className="w-full text-left px-3 py-1.5 text-[13.5px] text-[#b6c2cf] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Move all cards in this list</span>
            </button>

            {/* Sort by */}
            <button
              type="button"
              onClick={() => setActivePanel('sort')}
              disabled={column.cards.length <= 1}
              className="w-full text-left px-3 py-1.5 text-[13.5px] text-[#b6c2cf] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Sort by</span>
            </button>

            {/* Pin list (New) */}
            <button
              type="button"
              onClick={() => onTogglePinList(column.id)}
              className="w-full text-left px-3 py-1.5 text-[13.5px] text-[#b6c2cf] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer flex items-center justify-between"
            >
              <span>{isPinned ? 'Unpin list' : 'Pin list'}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#4d3280] text-[#c0b6f2] border border-[#7c3aed]/40">
                New
              </span>
            </button>

            {/* Watch */}
            <button
              type="button"
              onClick={() => onToggleWatchList(column.id)}
              className="w-full text-left px-3 py-1.5 text-[13.5px] text-[#b6c2cf] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer flex items-center justify-between"
            >
              <span>Watch</span>
              {isWatched && <Check className="w-4 h-4 text-[#579dff]" />}
            </button>

            {/* Change list color */}
            <button
              type="button"
              onClick={() => setActivePanel('color')}
              className="w-full text-left px-3 py-1.5 text-[13.5px] text-[#b6c2cf] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer flex items-center justify-between"
            >
              <span>Change list color</span>
              {listColor && (
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs shrink-0"
                  style={{ backgroundColor: listColor }}
                />
              )}
            </button>

            {/* Automation Accordion */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setIsAutomationOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[13.5px] text-[#b6c2cf] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition text-left cursor-pointer"
              >
                <span>Automation</span>
                {isAutomationOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#9fadbc]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#9fadbc]" />
                )}
              </button>

              {isAutomationOpen && (
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAutomationRule('When a card is added to the list');
                      setActivePanel('automation-rule');
                    }}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer"
                  >
                    When a card is added to the list
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAutomationRule('Every day, sort list by');
                      setActivePanel('automation-rule');
                    }}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer"
                  >
                    Every day, sort list by
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAutomationRule('Every Monday, sort list by');
                      setActivePanel('automation-rule');
                    }}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer"
                  >
                    Every Monday, sort list by
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAutomationRule('Create a rule');
                      setActivePanel('automation-rule');
                    }}
                    className="w-full text-left px-3 py-1.5 text-[13px] text-[#579dff] hover:text-[#85b8ff] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer font-medium"
                  >
                    Create a rule
                  </button>
                </div>
              )}
            </div>

            <div className="my-1 border-t border-[#384148]" />

            {/* Archive actions */}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onArchiveList(column.id);
                }}
                className="w-full text-left px-3 py-1.5 text-[13.5px] text-[#b6c2cf] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer"
              >
                Archive this list
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onArchiveAllCards(column.id);
                }}
                disabled={column.cards.length === 0}
                className="w-full text-left px-3 py-1.5 text-[13.5px] text-[#b6c2cf] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] rounded-sm transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                Archive all cards in this list
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PANEL: COPY LIST ----------------- */}
      {activePanel === 'copy' && (
        <div className="flex flex-col min-h-0">
          <div className="relative flex items-center justify-between px-3 py-2.5 border-b border-[#384148] shrink-0">
            <button
              type="button"
              onClick={() => setActivePanel('main')}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-[#9fadbc] text-center flex-1">Copy list</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCopySubmit} className="p-3 space-y-3 overflow-y-auto">
            <div>
              <label className="block text-[11px] font-semibold text-[#9fadbc] mb-1">
                Name
              </label>
              <input
                type="text"
                value={copyTitle}
                onChange={(e) => setCopyTitle(e.target.value)}
                autoFocus
                className="w-full h-8 px-2.5 rounded bg-[#1d2125] border border-[#738496] text-xs text-[#dcdfe4] focus:outline-none focus:border-[#579dff] transition"
              />
            </div>
            <button
              type="submit"
              disabled={!copyTitle.trim()}
              className="w-full h-8 rounded bg-[#579dff] hover:bg-[#85b8ff] disabled:opacity-50 text-xs font-semibold text-[#1d2125] transition cursor-pointer"
            >
              Create list
            </button>
          </form>
        </div>
      )}

      {/* ----------------- PANEL: MOVE LIST ----------------- */}
      {activePanel === 'move' && (
        <div className="flex flex-col min-h-0">
          <div className="relative flex items-center justify-between px-3 py-2.5 border-b border-[#384148] shrink-0">
            <button
              type="button"
              onClick={() => setActivePanel('main')}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-[#9fadbc] text-center flex-1">Move list</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-2 overflow-y-auto">
            <label className="block text-[11px] font-semibold text-[#9fadbc]">
              Position
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              {allColumns.map((col, idx) => {
                const isCurrent = col.id === column.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleMoveSubmit(idx + 1)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left transition cursor-pointer ${
                      isCurrent
                        ? 'bg-[#579dff]/20 text-[#85b8ff] font-bold border border-[#579dff]/30'
                        : 'text-[#b6c2cf] hover:bg-[#a6c5e214] hover:text-[#dcdfe4]'
                    }`}
                  >
                    <span>
                      Position {idx + 1} {isCurrent ? '(current)' : ''}
                    </span>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-[#579dff]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PANEL: MOVE ALL CARDS ----------------- */}
      {activePanel === 'move-all-cards' && (
        <div className="flex flex-col min-h-0">
          <div className="relative flex items-center justify-between px-3 py-2.5 border-b border-[#384148] shrink-0">
            <button
              type="button"
              onClick={() => setActivePanel('main')}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-[#9fadbc] text-center flex-1">Move all cards</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 overflow-y-auto">
            <p className="text-[11px] text-[#9fadbc] mb-2">
              Select a target list to transfer all {column.cards.length} cards:
            </p>

            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              {otherColumns.length === 0 ? (
                <p className="text-xs text-[#9fadbc]/60 italic py-2">No other lists available.</p>
              ) : (
                otherColumns.map((targetCol) => (
                  <button
                    key={targetCol.id}
                    type="button"
                    onClick={() => handleMoveAllSubmit(targetCol.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded text-xs text-[#b6c2cf] hover:bg-[#a6c5e214] hover:text-[#dcdfe4] transition text-left cursor-pointer"
                  >
                    <span className="font-medium truncate">{targetCol.title}</span>
                    <span className="text-[10px] text-[#9fadbc]">{targetCol.cards.length} cards</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PANEL: SORT BY ----------------- */}
      {activePanel === 'sort' && (
        <div className="flex flex-col min-h-0">
          <div className="relative flex items-center justify-between px-3 py-2.5 border-b border-[#384148] shrink-0">
            <button
              type="button"
              onClick={() => setActivePanel('main')}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-[#9fadbc] text-center flex-1">Sort list</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2 space-y-0.5 overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSortSubmit('newest')}
              className="w-full text-left px-3 py-2 rounded text-xs text-[#b6c2cf] hover:bg-[#a6c5e214] hover:text-[#dcdfe4] transition cursor-pointer"
            >
              Date created (newest first)
            </button>
            <button
              type="button"
              onClick={() => handleSortSubmit('oldest')}
              className="w-full text-left px-3 py-2 rounded text-xs text-[#b6c2cf] hover:bg-[#a6c5e214] hover:text-[#dcdfe4] transition cursor-pointer"
            >
              Date created (oldest first)
            </button>
            <button
              type="button"
              onClick={() => handleSortSubmit('alpha')}
              className="w-full text-left px-3 py-2 rounded text-xs text-[#b6c2cf] hover:bg-[#a6c5e214] hover:text-[#dcdfe4] transition cursor-pointer"
            >
              Card name (alphabetically)
            </button>
            <button
              type="button"
              onClick={() => handleSortSubmit('due_date')}
              className="w-full text-left px-3 py-2 rounded text-xs text-[#b6c2cf] hover:bg-[#a6c5e214] hover:text-[#dcdfe4] transition cursor-pointer"
            >
              Due date
            </button>
          </div>
        </div>
      )}

      {/* ----------------- PANEL: CHANGE LIST COLOR ----------------- */}
      {activePanel === 'color' && (
        <div className="flex flex-col min-h-0">
          <div className="relative flex items-center justify-between px-3 py-2.5 border-b border-[#384148] shrink-0">
            <button
              type="button"
              onClick={() => setActivePanel('main')}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-[#9fadbc] text-center flex-1">List color</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 overflow-y-auto custom-scrollbar">
            <p className="text-[11px] text-[#9fadbc] mb-3">
              Choose a color for this list. This color persists across reloads and logouts:
            </p>

            <div className="grid grid-cols-5 gap-2 mb-3">
              {LIST_COLOR_PRESETS.map((preset) => {
                const isSelected = listColor === preset.hex || (!listColor && preset.hex === null);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChangeListColor(column.id, preset.hex)}
                    title={preset.name}
                    className={`h-8 rounded-md flex items-center justify-center transition cursor-pointer border ${
                      isSelected ? 'ring-2 ring-white border-white scale-105' : 'border-white/10 hover:scale-105'
                    } ${preset.class}`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Color Picker */}
            <div className="flex items-center gap-2 p-2 rounded bg-[#1d2125] border border-[#384148] mb-3">
              <input
                type="color"
                value={listColor || '#2563eb'}
                onChange={(e) => onChangeListColor(column.id, e.target.value)}
                className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
              />
              <span className="text-xs text-[#b6c2cf] font-mono">
                {listColor || 'Default'}
              </span>
            </div>

            {listColor && (
              <button
                type="button"
                onClick={() => onChangeListColor(column.id, null)}
                className="w-full flex items-center justify-center gap-1.5 h-8 rounded bg-white/5 hover:bg-white/10 text-xs font-medium text-[#b6c2cf] hover:text-[#dcdfe4] transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to default color</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ----------------- PANEL: AUTOMATION RULE ----------------- */}
      {activePanel === 'automation-rule' && (
        <div className="flex flex-col min-h-0">
          <div className="relative flex items-center justify-between px-3 py-2.5 border-b border-[#384148] shrink-0">
            <button
              type="button"
              onClick={() => setActivePanel('main')}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-[#9fadbc] text-center flex-1">Rule Config</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-[#9fadbc] hover:text-[#dcdfe4] hover:bg-[#a6c5e214] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Butler Automation
              </span>
              <p className="text-xs font-semibold text-[#dcdfe4] mb-1">
                {activeAutomationRule}
              </p>
              <p className="text-[11px] text-[#9fadbc]">
                Trigger this automated rule for cards in "{column.title}".
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
              }}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded bg-[#579dff] hover:bg-[#85b8ff] text-xs font-semibold text-[#1d2125] transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enable Automation Rule</span>
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default ListActionsMenu;
