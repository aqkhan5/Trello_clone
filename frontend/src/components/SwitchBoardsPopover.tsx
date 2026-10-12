import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Layers,
  X,
  ExternalLink,
  Kanban,
} from 'lucide-react';
import { boardService, type Board } from '../services/boardService';

export interface SwitchBoardsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoardId?: string;
  workspaceId?: string;
  workspaceName?: string;
  onOpenCreateBoard?: () => void;
}

export const SwitchBoardsPopover: React.FC<SwitchBoardsPopoverProps> = ({
  isOpen,
  onClose,
  currentBoardId,
  workspaceId,
  workspaceName = 'Workspace',
  onOpenCreateBoard,
}) => {
  const navigate = useNavigate();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchBoards = async () => {
      setIsLoading(true);
      try {
        const list = await boardService.getBoards(workspaceId);
        setBoards(list || []);
      } catch (err) {
        console.warn('Failed to load boards for switcher:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, [isOpen, workspaceId]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBoard = (bId: string) => {
    onClose();
    if (bId !== currentBoardId) {
      navigate(`/board/${bId}`);
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full mb-3 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-80 max-w-[92vw] rounded-2xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl p-3 z-50 text-xs text-[#b6c2cf] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-400" />
          <span className="font-bold text-white text-xs">Switch Boards</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Workspace Context Tag */}
      <div className="mb-2 px-1 text-[11px] text-white/50 truncate">
        Workspace: <span className="text-white/80 font-medium">{workspaceName}</span>
      </div>

      {/* Search Input */}
      <div className="relative mb-2.5">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" />
        <input
          type="text"
          autoFocus
          placeholder="Search boards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition"
        />
      </div>

      {/* Boards List */}
      <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5 mb-2">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-white/40 italic">
            Loading boards...
          </div>
        ) : filteredBoards.length > 0 ? (
          filteredBoards.map((b) => {
            const isCurrent = b.id === currentBoardId;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectBoard(b.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600/30 border border-blue-500/40 text-white font-semibold'
                    : 'hover:bg-white/10 text-white/80 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Thumbnail / Icon */}
                  <div
                    className="h-6 w-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm"
                    style={{
                      background: b.background_color || 'linear-gradient(135deg, #0052cc, #0065ff)',
                    }}
                  >
                    <Kanban className="h-3 w-3 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs truncate">{b.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {isCurrent && (
                    <span className="rounded bg-blue-500/30 text-blue-300 text-[10px] px-1.5 py-0.2 font-medium">
                      Current
                    </span>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-6 text-center text-xs text-white/40 italic">
            No boards found
          </div>
        )}
      </div>

      {/* Footer Quick Actions */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
        {onOpenCreateBoard && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreateBoard();
            }}
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition cursor-pointer font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create new board</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onClose();
            navigate('/dashboard');
          }}
          className="inline-flex items-center gap-1 text-white/50 hover:text-white transition ml-auto cursor-pointer"
        >
          <span>All boards</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default SwitchBoardsPopover;
