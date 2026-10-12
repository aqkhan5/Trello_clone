// src/components/StarredBoardsPopover.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, X, Kanban } from 'lucide-react';
import {
  getStarredBoards,
  unstarBoard,
  onBoardNavChange,
  type BoardNavItem,
} from '../services/boardNavService';

export interface StarredBoardsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoardId?: string;
}

export const StarredBoardsPopover: React.FC<StarredBoardsPopoverProps> = ({
  isOpen,
  onClose,
  currentBoardId,
}) => {
  const navigate = useNavigate();
  const [starredBoards, setStarredBoards] = useState<BoardNavItem[]>([]);

  const loadStarred = () => {
    setStarredBoards(getStarredBoards());
  };

  useEffect(() => {
    loadStarred();
    const cleanup = onBoardNavChange(loadStarred);
    return cleanup;
  }, []);

  if (!isOpen) return null;

  const handleUnstar = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    e.preventDefault();
    unstarBoard(boardId);
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
        <h3 className="text-xs font-semibold text-white/90">Starred boards</h3>
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
      {starredBoards.length > 0 ? (
        <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1 pr-1">
          {starredBoards.map((b) => {
            const isCurrent = b.id === currentBoardId;

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

                {/* Star Button (Click to unstar) */}
                <button
                  type="button"
                  onClick={(e) => handleUnstar(e, b.id)}
                  className="p-1 rounded hover:bg-white/15 text-amber-400 transition cursor-pointer ml-1"
                  title="Unstar board"
                >
                  <Star className="h-4 w-4 fill-current text-amber-400 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-6 px-3 text-center flex flex-col items-center">
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-2.5 text-amber-400/80">
            <Star className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-semibold text-white/90 mb-1">
            No starred boards
          </h4>
          <p className="text-[11px] text-white/50 leading-relaxed max-w-[220px]">
            Star your most important boards to keep them right at hand. Click the star icon next to a board title to star it!
          </p>
        </div>
      )}
    </div>
  );
};

export default StarredBoardsPopover;
