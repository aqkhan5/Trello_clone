// src/components/RecentBoardsPopover.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, X, Star, Kanban } from 'lucide-react';
import {
  getRecentBoards,
  isBoardStarred,
  toggleStarBoard,
  onBoardNavChange,
  type BoardNavItem,
} from '../services/boardNavService';
import { boardService } from '../services/boardService';

export interface RecentBoardsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoardId?: string;
  workspaceName?: string;
}

export const RecentBoardsPopover: React.FC<RecentBoardsPopoverProps> = ({
  isOpen,
  onClose,
  currentBoardId,
  workspaceName,
}) => {
  const navigate = useNavigate();
  const [recentBoards, setRecentBoards] = useState<BoardNavItem[]>([]);

  const loadRecent = async () => {
    const local = getRecentBoards();
    if (local.length > 0) {
      setRecentBoards(local);
      return;
    }

    // Fallback: If localStorage is empty, fetch available boards from backend
    try {
      const allBoards = await boardService.getBoards();
      if (allBoards && allBoards.length > 0) {
        const mapped: BoardNavItem[] = allBoards.slice(0, 8).map((b) => ({
          id: b.id,
          title: b.title,
          workspaceName: workspaceName || 'Workspace',
          background: (b as any).background || null,
          isStarred: isBoardStarred(b.id),
        }));
        setRecentBoards(mapped);
      } else {
        setRecentBoards([]);
      }
    } catch {
      setRecentBoards([]);
    }
  };

  useEffect(() => {
    loadRecent();
    const cleanup = onBoardNavChange(loadRecent);
    return cleanup;
  }, []);

  if (!isOpen) return null;

  const handleToggleStar = (e: React.MouseEvent, board: BoardNavItem) => {
    e.stopPropagation();
    e.preventDefault();
    toggleStarBoard(board);
  };

  const handleBoardClick = (boardId: string) => {
    onClose();
    navigate(`/board/${boardId}`);
  };

  return (
    <div
      className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 rounded-2xl border border-white/10 bg-[#22272b] p-3.5 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/10">
        <h3 className="text-xs font-semibold text-white/90">Recent boards</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Board Items */}
      {recentBoards.length > 0 ? (
        <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1 pr-1">
          {recentBoards.map((b) => {
            const isCurrent = b.id === currentBoardId;
            const starred = isBoardStarred(b.id);

            return (
              <div
                key={b.id}
                onClick={() => handleBoardClick(b.id)}
                className={`group flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                  isCurrent
                    ? 'bg-white/15 text-white'
                    : 'hover:bg-white/10 text-white/90'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Miniature Thumbnail */}
                  <div
                    className={`h-7 w-9 shrink-0 rounded-md overflow-hidden flex items-center justify-center border border-white/10 shadow-sm ${
                      b.background?.startsWith('bg-')
                        ? b.background
                        : b.background?.startsWith('http')
                        ? ''
                        : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                    }`}
                    style={
                      b.background?.startsWith('http')
                        ? {
                            backgroundImage: `url(${b.background})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : b.background?.startsWith('#')
                        ? { backgroundColor: b.background }
                        : undefined
                    }
                  >
                    {!b.background?.startsWith('http') && (
                      <Kanban className="h-3.5 w-3.5 text-white/60" />
                    )}
                  </div>

                  {/* Title & Workspace */}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-white truncate">
                      {b.title}
                    </div>
                    <div className="text-[10px] text-white/50 truncate">
                      {b.workspaceName || 'Workspace'}
                    </div>
                  </div>
                </div>

                {/* Star Button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleStar(e, b)}
                  className={`p-1 rounded hover:bg-white/15 transition cursor-pointer ml-1 ${
                    starred
                      ? 'text-amber-400'
                      : 'text-white/30 hover:text-amber-400 group-hover:text-white/60'
                  }`}
                  title={starred ? 'Unstar board' : 'Star board'}
                >
                  <Star
                    className={`h-4 w-4 transition-transform hover:scale-110 ${
                      starred ? 'fill-current text-amber-400' : ''
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-6 px-3 text-center flex flex-col items-center">
          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2.5 text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-semibold text-white/90 mb-1">
            No recent boards
          </h4>
          <p className="text-[11px] text-white/50 leading-relaxed max-w-[220px]">
            Boards you visit will automatically appear here for quick access.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentBoardsPopover;
