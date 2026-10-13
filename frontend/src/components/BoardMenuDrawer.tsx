import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Info,
  Lock,
  Globe,
  Users,
  UserPlus,
  UserMinus,
  ShieldCheck,
  Loader2,
  Printer,
  Download,
  Copy,
  Star,
  Settings,
  Image as ImageIcon,
  Sparkles,
  Workflow,
  Puzzle,
  Tag,
  Smile,
  Clock,
  Archive,
  Eye,
  Mail,
  MinusCircle,
  Flag,
  Check,
  Trash2,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { boardService, type Board, type BoardMemberItem } from '../services/boardService';
import type { UserResponse } from '../services/auth';
import type { KanbanColumnItem, KanbanCardItem } from '../pages/KanbanBoardPage';
import { listService, type BoardList } from '../services/listService';
import { cardService } from '../services/cardService';

export type BoardMenuPanel =
  | 'main'
  | 'about'
  | 'members'
  | 'visibility'
  | 'export'
  | 'settings'
  | 'background'
  | 'automation'
  | 'powerups'
  | 'labels'
  | 'stickers'
  | 'activity'
  | 'archived';

export interface BoardMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activePanel?: BoardMenuPanel;
  onPanelChange?: (panel: BoardMenuPanel) => void;
  board: Board | null;
  currentUser: UserResponse | null;
  columns: KanbanColumnItem[];
  currentBg: string | null;
  onBackgroundChange: (bg: string | null) => void;
  isStarred: boolean;
  onToggleStar: () => void;
  isWatching: boolean;
  onToggleWatch: () => void;
  onUpdateBoardDescription?: (desc: string) => void;
  onUpdateBoardVisibility?: (visibility: string) => void;
  onCloseBoard?: () => void;
  onCopyBoard?: (newTitle: string) => void;
  onOpenShareModal: () => void;
  onRestoreCard?: (card: KanbanCardItem) => void | Promise<void>;
  onRestoreList?: (listId: string) => void | Promise<void>;
  onDeleteCardPermanently?: (cardId: string) => void;
  onAddSticker?: (sticker: string) => void;
}

const COLOR_PRESETS = [
  { id: 'slate', name: 'Deep Slate', value: 'linear-gradient(180deg, #1e293b, #0f172a)' },
  { id: 'blue', name: 'Midnight Blue', value: 'linear-gradient(180deg, #1e3a8a, #0f172a)' },
  { id: 'emerald', name: 'Emerald Forest', value: 'linear-gradient(180deg, #064e3b, #022c22)' },
  { id: 'purple', name: 'Royal Violet', value: 'linear-gradient(180deg, #4c1d95, #1e1b4b)' },
  { id: 'crimson', name: 'Sunset Crimson', value: 'linear-gradient(180deg, #881337, #4c0519)' },
  { id: 'amber', name: 'Warm Amber', value: 'linear-gradient(180deg, #78350f, #451a03)' },
  { id: 'cyan', name: 'Ocean Cyan', value: 'linear-gradient(180deg, #155e75, #083344)' },
  { id: 'zinc', name: 'Neutral Zinc', value: 'linear-gradient(180deg, #27272a, #18181b)' },
];

const PHOTO_PRESETS = [
  {
    id: 'mountains',
    title: 'Alpine Dusk',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'forest',
    title: 'Deep Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'ocean',
    title: 'Ocean Sunset',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'space',
    title: 'Cosmic Night',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'geometry',
    title: 'Neon Geometry',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1920&q=80',
  },
];

const STICKERS = ['👍', '🚀', '⭐', '🔥', '🎉', '❤️', '⚠️', '💡', '🐛', '✅', '🎯', '✨'];

export const BoardMenuDrawer: React.FC<BoardMenuDrawerProps> = ({
  isOpen,
  onClose,
  activePanel: controlledPanel,
  onPanelChange,
  board,
  currentUser,
  columns,
  currentBg,
  onBackgroundChange,
  isStarred,
  onToggleStar,
  isWatching,
  onToggleWatch,
  onUpdateBoardDescription,
  onUpdateBoardVisibility,
  onCloseBoard,
  onCopyBoard,
  onOpenShareModal,
  onRestoreCard,
  onRestoreList,
  onDeleteCardPermanently,
  onAddSticker,
}) => {
  const [internalPanel, setInternalPanel] = useState<BoardMenuPanel>('main');
  const panel = controlledPanel || internalPanel;

  const setPanel = (p: BoardMenuPanel) => {
    if (onPanelChange) {
      onPanelChange(p);
    }
    setInternalPanel(p);
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // About panel state
  const [description, setDescription] = useState(board?.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // Custom photo input
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');

  // Settings state
  const [cardCoversEnabled, setCardCoversEnabled] = useState(true);
  const [commentingRule, setCommentingRule] = useState<'members' | 'anyone' | 'disabled'>('members');

  // Automation toggles
  const [autoCompleteDone, setAutoCompleteDone] = useState(true);
  const [autoAddPriority, setAutoAddPriority] = useState(false);
  const [autoSortDates, setAutoSortDates] = useState(false);

  // Power-ups state
  const [powerUps, setPowerUps] = useState({
    github: true,
    slack: false,
    calendar: true,
    googleDrive: false,
    webhooks: true,
  });

  // Copy board prompt state
  const [copyTitle, setCopyTitle] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  // Archived items
  const [archivedTab, setArchivedTab] = useState<'cards' | 'lists'>('cards');
  const [archivedCards, setArchivedCards] = useState<KanbanCardItem[]>([]);
  const [archivedLists, setArchivedLists] = useState<BoardList[]>([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [archivedSearchQuery, setArchivedSearchQuery] = useState('');

  const fetchArchivedItems = async () => {
    if (!board?.id) return;
    setIsLoadingArchived(true);
    try {
      // 1. Fetch all lists for this board including archived
      const allLists = await listService.getListsByBoard(board.id, true);
      const archivedL = allLists.filter((l) => l.is_archived);
      setArchivedLists(archivedL);

      // 2. Fetch cards from all lists including archived cards
      const cardPromises = allLists.map((l) =>
        cardService.getCardsByList(l.id, true).catch(() => [])
      );
      const allCardsNested = await Promise.all(cardPromises);
      const allCardsFlat = allCardsNested.flat();
      const archivedC: KanbanCardItem[] = allCardsFlat
        .filter((c) => c.is_archived)
        .map((c) => ({
          id: c.id,
          title: c.title,
          list_id: c.list_id,
          description: c.description || undefined,
          completed: c.is_completed || false,
          dueDate: c.due_date ? new Date(c.due_date).toLocaleDateString() : undefined,
          tags: [],
        }));
      setArchivedCards(archivedC);
    } catch (err) {
      console.warn('Failed to fetch archived items:', err);
    } finally {
      setIsLoadingArchived(false);
    }
  };

  useEffect(() => {
    if (isOpen && panel === 'archived' && board?.id) {
      fetchArchivedItems();
    }
  }, [isOpen, panel, board?.id]);

  // Board members state
  const [boardMembers, setBoardMembers] = useState<BoardMemberItem[]>([]);
  const [isLoadingBoardMembers, setIsLoadingBoardMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);

  const fetchBoardMembers = async () => {
    if (!board?.id) return;
    setIsLoadingBoardMembers(true);
    try {
      const members = await boardService.getBoardMembers(board.id);
      setBoardMembers(members);
    } catch (err) {
      console.warn('Failed to fetch board members:', err);
    } finally {
      setIsLoadingBoardMembers(false);
    }
  };

  useEffect(() => {
    if (isOpen && board?.id && (panel === 'members' || panel === 'main')) {
      fetchBoardMembers();
    }
  }, [isOpen, panel, board?.id]);

  const handleUpdateRole = async (userId: string, role: 'ADMIN' | 'MEMBER' | 'OBSERVER') => {
    if (!board?.id) return;
    setMemberActionLoading(userId);
    try {
      const updated = await boardService.updateBoardMemberRole(board.id, userId, role);
      setBoardMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: updated.role } : m))
      );
      showToast('Member role updated');
    } catch (err: any) {
      console.error('Failed to update member role:', err);
      showToast(err?.response?.data?.detail || 'Failed to update member role');
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!board?.id) return;
    if (!window.confirm('Are you sure you want to remove this member from the board?')) return;
    setMemberActionLoading(userId);
    try {
      await boardService.removeBoardMember(board.id, userId);
      setBoardMembers((prev) => prev.filter((m) => m.user_id !== userId));
      showToast('Member removed from board');
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      showToast(err?.response?.data?.detail || 'Failed to remove member');
    } finally {
      setMemberActionLoading(null);
    }
  };

  // Activity logs
  const [activityLogs] = useState<
    { id: string; user: string; action: string; time: string }[]
  >([
    { id: 'act-1', user: currentUser?.full_name || 'You', action: 'opened this board', time: 'Just now' },
    { id: 'act-2', user: 'System', action: 'synced with FastAPI backend gateway', time: '1 min ago' },
    { id: 'act-3', user: currentUser?.full_name || 'You', action: 'updated board settings', time: '5 mins ago' },
  ]);

  // Close board confirmation
  const [confirmCloseBoard, setConfirmCloseBoard] = useState(false);

  // Email to board modal
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    if (board?.description !== undefined) {
      setDescription(board.description || '');
    }
  }, [board?.description]);

  if (!isOpen) return null;

  const userInitials = currentUser?.full_name
    ? currentUser.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const handleExportJson = () => {
    const exportData = {
      board: {
        id: board?.id,
        title: board?.title,
        visibility: board?.visibility,
        created_at: board?.created_at,
        exported_at: new Date().toISOString(),
      },
      lists: columns.map((col, index) => ({
        id: col.id,
        title: col.title,
        position: index + 1,
        cardsCount: col.cards.length,
        cards: col.cards.map((c, cIndex) => ({
          id: c.id,
          title: c.title,
          description: c.description || null,
          position: c.position || cIndex + 1,
          due_date: c.dueDate || null,
          completed: Boolean(c.completed),
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(board?.title || 'board').toLowerCase().replace(/\s+/g, '-')}-export.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Board data exported as JSON');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Board link copied to clipboard!');
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in Menu Drawer */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-80 sm:w-88 bg-zinc-900 border-l border-white/10 text-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            {panel !== 'main' && (
              <button
                type="button"
                onClick={() => setPanel('main')}
                className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Back to menu"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-sm font-bold text-white capitalize">
              {panel === 'main'
                ? 'Menu'
                : panel === 'about'
                ? 'About this board'
                : panel === 'members'
                ? 'Board members'
                : panel === 'visibility'
                ? 'Change visibility'
                : panel === 'export'
                ? 'Print, export, and share'
                : panel === 'background'
                ? 'Change background'
                : panel === 'settings'
                ? 'Settings'
                : panel === 'automation'
                ? 'Automation'
                : panel === 'powerups'
                ? 'Power-Ups'
                : panel === 'labels'
                ? 'Labels'
                : panel === 'stickers'
                ? 'Stickers'
                : panel === 'activity'
                ? 'Activity'
                : panel === 'archived'
                ? 'Archived items'
                : 'Menu'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Toast inside drawer */}
        {toastMessage && (
          <div className="mx-4 mt-2 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* Drawer Body Views */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* ================= PANEL: MAIN ================= */}
          {panel === 'main' && (
            <div className="space-y-1">
              {/* Share */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShareModal();
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-white/90">Share</span>
                </div>
                <div className="h-6 w-6 rounded-full bg-[#0052cc] text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                  {userInitials}
                </div>
              </button>

              {/* About this board */}
              <button
                type="button"
                onClick={() => setPanel('about')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-white/70" />
                  <span className="text-xs font-medium text-white/90">About this board</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              {/* Board members */}
              <button
                type="button"
                onClick={() => setPanel('members')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-medium text-white/90">Board members</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {boardMembers.length > 0 && (
                    <span className="text-[11px] font-medium text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                      {boardMembers.length}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
                </div>
              </button>

              {/* Visibility */}
              <button
                type="button"
                onClick={() => setPanel('visibility')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-medium text-white/90">
                      Visibility: {board?.visibility ? board.visibility.charAt(0).toUpperCase() + board.visibility.slice(1).toLowerCase() : 'Workspace'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              {/* Print, export, and share */}
              <button
                type="button"
                onClick={() => setPanel('export')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-white/90">Print, export, and share</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              {/* Star */}
              <button
                type="button"
                onClick={() => {
                  onToggleStar();
                  showToast(isStarred ? 'Board unstarred' : 'Board starred!');
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Star className={`w-4 h-4 ${isStarred ? 'text-amber-400 fill-current' : 'text-white/70'}`} />
                  <span className="text-xs font-medium text-white/90">
                    {isStarred ? 'Starred' : 'Star'}
                  </span>
                </div>
                {isStarred && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              <div className="my-1.5 border-t border-white/5" />

              {/* Settings */}
              <button
                type="button"
                onClick={() => setPanel('settings')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-white/70" />
                  <span className="text-xs font-medium text-white/90">Settings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              {/* Change background */}
              <button
                type="button"
                onClick={() => setPanel('background')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-sm border border-white/20 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <ImageIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-white/90">Change background</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              {/* Upgrade Banner for Custom Fields */}
              <div className="my-2 rounded-xl bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-zinc-800/50 border border-purple-500/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Custom Fields
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                    Pro
                  </span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Add dropdowns, text fields, dates, and numbers directly to your cards.
                </p>
                <button
                  type="button"
                  onClick={() => showToast('Custom Fields are enabled on this board!')}
                  className="w-full py-1 text-center rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                >
                  Configure Fields
                </button>
              </div>

              {/* Automation */}
              <button
                type="button"
                onClick={() => setPanel('automation')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Workflow className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-white/90">Automation</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              {/* Power-Ups */}
              <button
                type="button"
                onClick={() => setPanel('powerups')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Puzzle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-white/90">Power-Ups</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              {/* Labels */}
              <button
                type="button"
                onClick={() => setPanel('labels')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-white/90">Labels</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              {/* Stickers */}
              <button
                type="button"
                onClick={() => setPanel('stickers')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Smile className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-medium text-white/90">Stickers</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              {/* Activity */}
              <button
                type="button"
                onClick={() => setPanel('activity')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-white/70" />
                  <span className="text-xs font-medium text-white/90">Activity</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              {/* Archived items */}
              <button
                type="button"
                onClick={() => setPanel('archived')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Archive className="w-4 h-4 text-white/70" />
                  <span className="text-xs font-medium text-white/90">Archived items</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition" />
              </button>

              <div className="my-1.5 border-t border-white/5" />

              {/* Watch */}
              <button
                type="button"
                onClick={() => {
                  onToggleWatch();
                  showToast(isWatching ? 'No longer watching board' : 'Now watching board for notifications!');
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Eye className={`w-4 h-4 ${isWatching ? 'text-emerald-400' : 'text-white/70'}`} />
                  <span className="text-xs font-medium text-white/90">
                    {isWatching ? 'Watching' : 'Watch'}
                  </span>
                </div>
                {isWatching && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              {/* Copy board */}
              <button
                type="button"
                onClick={() => setIsCopying(true)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer"
              >
                <Copy className="w-4 h-4 text-white/70" />
                <span className="text-xs font-medium text-white/90">Copy board</span>
              </button>

              {/* Email-to-board */}
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition text-left cursor-pointer"
              >
                <Mail className="w-4 h-4 text-white/70" />
                <span className="text-xs font-medium text-white/90">Email-to-board</span>
              </button>

              {/* Close board */}
              <button
                type="button"
                onClick={() => setConfirmCloseBoard(true)}
                className="w-full flex items-center gap-3 p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition text-left cursor-pointer"
              >
                <MinusCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Close board...</span>
              </button>

              {/* Report abuse */}
              <button
                type="button"
                onClick={() => showToast('Thank you. Report received by trust & safety.')}
                className="w-full flex items-center gap-3 p-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition text-left cursor-pointer"
              >
                <Flag className="w-4 h-4" />
                <span className="text-xs font-medium">Report abuse</span>
              </button>
            </div>
          )}

          {/* ================= PANEL: ABOUT THIS BOARD ================= */}
          {panel === 'about' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Board Administrator
                </span>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="h-10 w-10 rounded-xl bg-[#0052cc] text-white flex items-center justify-center font-bold text-sm shadow">
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {currentUser?.full_name || 'Board Creator'}
                    </p>
                    <p className="text-[10px] text-white/50 truncate">{currentUser?.email || 'Admin'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                    Description
                  </span>
                  {!isEditingDesc && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDesc(true)}
                      className="text-xs text-emerald-400 hover:text-white transition cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a detailed description for this board..."
                      rows={4}
                      className="w-full rounded-xl border border-emerald-500 bg-black/40 p-2.5 text-xs text-white placeholder-white/40 focus:outline-none resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingDesc(false);
                          if (onUpdateBoardDescription) {
                            onUpdateBoardDescription(description);
                          }
                          showToast('Board description updated!');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0052cc] hover:bg-blue-600 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDescription(board?.description || '');
                          setIsEditingDesc(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDesc(true)}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-white/70 hover:bg-white/10 transition cursor-pointer min-h-[70px] leading-relaxed"
                  >
                    {description || 'It is your board’s time to shine! Let people know what this board is used for and what they can expect to see.'}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/5 space-y-2 text-xs text-white/60">
                <div className="flex items-center justify-between">
                  <span>Created</span>
                  <span className="text-white/90 font-medium">
                    {board?.created_at ? new Date(board.created_at).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Lists</span>
                  <span className="text-white/90 font-medium">{columns.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Cards</span>
                  <span className="text-white/90 font-medium">
                    {columns.reduce((acc, c) => acc + c.cards.length, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= PANEL: MEMBERS ================= */}
          {panel === 'members' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Header actions: Invite */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">Board Members</h3>
                  <p className="text-[10px] text-white/50">
                    {boardMembers.length} {boardMembers.length === 1 ? 'member' : 'members'} with access
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenShareModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0052cc] hover:bg-blue-600 text-white text-xs font-semibold shadow transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
              </div>

              {/* Search filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search board members..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Member list */}
              {isLoadingBoardMembers ? (
                <div className="py-10 text-center text-xs text-white/50 flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  <span>Loading board members...</span>
                </div>
              ) : boardMembers.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40 italic border border-dashed border-white/10 rounded-xl">
                  No members found on this board.
                </div>
              ) : (
                <div className="space-y-2">
                  {boardMembers
                    .filter((m) =>
                      (m.user?.full_name || m.user?.email || '')
                        .toLowerCase()
                        .includes(memberSearchQuery.toLowerCase())
                    )
                    .map((m) => {
                      const isCreator = m.user_id === board?.created_by;
                      const isCurrentUser = m.user_id === currentUser?.id;
                      const initials = m.user?.full_name
                        ? m.user.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : (m.user?.email || 'U').slice(0, 2).toUpperCase();

                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs hover:border-white/15 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {m.user?.avatar_url ? (
                              <img
                                src={m.user.avatar_url}
                                alt={m.user.full_name || 'Member'}
                                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/20"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#0052cc]/30 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-white truncate text-xs">
                                  {m.user?.full_name || m.user?.email || 'Board Member'}
                                  {isCurrentUser && ' (You)'}
                                </p>
                                {isCreator && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    Owner
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-white/50 truncate">{m.user?.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCreator ? (
                              <span className="text-[10px] text-white/40 font-medium px-2 py-1">Admin</span>
                            ) : (
                              <>
                                <select
                                  value={m.role}
                                  disabled={memberActionLoading === m.user_id}
                                  onChange={(e) =>
                                    handleUpdateRole(
                                      m.user_id,
                                      e.target.value as 'ADMIN' | 'MEMBER' | 'OBSERVER'
                                    )
                                  }
                                  className="rounded-lg bg-zinc-800 border border-white/15 px-2 py-1 text-[11px] text-white focus:outline-none cursor-pointer disabled:opacity-50"
                                >
                                  <option value="ADMIN">Admin</option>
                                  <option value="MEMBER">Member</option>
                                  <option value="OBSERVER">Observer</option>
                                </select>
                                <button
                                  type="button"
                                  disabled={memberActionLoading === m.user_id}
                                  onClick={() => handleRemoveMember(m.user_id)}
                                  className="p-1 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-50"
                                  title="Remove from board"
                                >
                                  {memberActionLoading === m.user_id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                  ) : (
                                    <UserMinus className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ================= PANEL: VISIBILITY ================= */}
          {panel === 'visibility' && (
            <div className="space-y-3 animate-in fade-in">
              <p className="text-xs text-white/60 leading-relaxed">
                Choose who can see this board. Anyone on the board can see cards and lists.
              </p>

              {[
                {
                  id: 'private',
                  title: 'Private',
                  desc: 'Only board members can see and edit this board.',
                  icon: Lock,
                  color: 'text-rose-400',
                },
                {
                  id: 'workspace',
                  title: 'Workspace',
                  desc: 'All members of the workspace can see and edit this board.',
                  icon: Users,
                  color: 'text-amber-400',
                },
                {
                  id: 'public',
                  title: 'Public',
                  desc: 'Anyone on the internet can see this board. Only members can edit.',
                  icon: Globe,
                  color: 'text-emerald-400',
                },
              ].map((item) => {
                const isSelected =
                  (board?.visibility || 'workspace').toLowerCase() === item.id.toLowerCase();
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (onUpdateBoardVisibility) {
                        onUpdateBoardVisibility(item.id.toUpperCase());
                      }
                      showToast(`Board visibility updated to ${item.title}`);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition space-y-1 ${
                      isSelected
                        ? 'bg-[#0052cc]/20 border-[#0052cc] text-white'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-xs font-bold text-white">{item.title}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed pl-6">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= PANEL: EXPORT & SHARE ================= */}
          {panel === 'export' && (
            <div className="space-y-3 animate-in fade-in">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Copy link to board</p>
                    <p className="text-[10px] text-white/50">Share with colleagues</p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-white/40" />
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Print board</p>
                    <p className="text-[10px] text-white/50">Send to printer or save as PDF</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40" />
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Export as JSON</p>
                    <p className="text-[10px] text-white/50">Complete lists, cards & metadata</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40" />
              </button>
            </div>
          )}

          {/* ================= PANEL: CHANGE BACKGROUND ================= */}
          {panel === 'background' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Reset to System Default Option */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mb-2">
                  System Default
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onBackgroundChange(null);
                    showToast('Background reset to System Default!');
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                    !currentBg || currentBg === 'default'
                      ? 'bg-[#0052cc]/20 border-emerald-500 text-white'
                      : 'bg-zinc-950 border-white/10 hover:border-white/30 text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-white/20 flex items-center justify-center">
                      <Sliders className="w-3.5 h-3.5 text-white/60" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">System Default</p>
                      <p className="text-[10px] text-white/50">Clean dark theme (no picture)</p>
                    </div>
                  </div>
                  {(!currentBg || currentBg === 'default') && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              </div>

              {/* Colors Section */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mb-2">
                  Colors & Gradients
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_PRESETS.map((color) => {
                    const isSelected = currentBg === color.value;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => {
                          onBackgroundChange(color.value);
                          showToast(`Applied ${color.name} background`);
                        }}
                        className="h-16 rounded-xl border border-white/10 hover:scale-[1.02] transition shadow-md flex items-end p-2 cursor-pointer relative overflow-hidden"
                        style={{ background: color.value }}
                      >
                        <span className="text-[10px] font-bold text-white drop-shadow">
                          {color.name}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photos Section */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mb-2">
                  Scenic Photos
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PHOTO_PRESETS.map((photo) => {
                    const isSelected = currentBg === photo.url;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => {
                          onBackgroundChange(photo.url);
                          showToast(`Applied ${photo.title}`);
                        }}
                        className="h-16 rounded-xl border border-white/10 hover:scale-[1.02] transition shadow-md bg-cover bg-center flex items-end p-2 cursor-pointer relative overflow-hidden group"
                        style={{ backgroundImage: `url('${photo.url}')` }}
                      >
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition" />
                        <span className="relative z-10 text-[10px] font-bold text-white drop-shadow">
                          {photo.title}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#0052cc] text-white flex items-center justify-center z-10">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block">
                  Custom Image URL
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    placeholder="https://example.com/wallpaper.jpg"
                    className="flex-1 h-8 rounded-lg border border-white/15 bg-black/40 px-2.5 text-xs text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customPhotoUrl.trim()) {
                        onBackgroundChange(customPhotoUrl.trim());
                        showToast('Custom wallpaper applied!');
                      }
                    }}
                    className="h-8 px-3 rounded-lg bg-[#0052cc] hover:bg-blue-600 text-white text-xs font-semibold transition cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= PANEL: SETTINGS ================= */}
          {panel === 'settings' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-xs font-bold text-white">Card Covers</p>
                  <p className="text-[10px] text-white/50">Show image covers on cards</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCardCoversEnabled(!cardCoversEnabled);
                    showToast(cardCoversEnabled ? 'Card covers disabled' : 'Card covers enabled');
                  }}
                  className={`w-10 h-5 rounded-full transition cursor-pointer p-0.5 ${
                    cardCoversEnabled ? 'bg-[#0052cc]' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      cardCoversEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <p className="text-xs font-bold text-white">Commenting Permissions</p>
                <div className="space-y-1">
                  {(['members', 'anyone', 'disabled'] as const).map((rule) => (
                    <label
                      key={rule}
                      className="flex items-center gap-2 text-xs text-white/80 cursor-pointer capitalize py-1"
                    >
                      <input
                        type="radio"
                        name="commenting"
                        checked={commentingRule === rule}
                        onChange={() => setCommentingRule(rule)}
                        className="text-blue-500 focus:ring-0"
                      />
                      <span>{rule}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= PANEL: AUTOMATION ================= */}
          {panel === 'automation' && (
            <div className="space-y-3 animate-in fade-in">
              <p className="text-xs text-white/60 leading-relaxed">
                Butler automation rules streamline your team's workflow automatically.
              </p>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Mark complete in Done</span>
                  <button
                    type="button"
                    onClick={() => setAutoCompleteDone(!autoCompleteDone)}
                    className={`w-9 h-5 rounded-full transition cursor-pointer p-0.5 ${
                      autoCompleteDone ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        autoCompleteDone ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-white/50">
                  When a card is moved to "Done", automatically mark its due date completed.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Auto-sort deadlines</span>
                  <button
                    type="button"
                    onClick={() => setAutoSortDates(!autoSortDates)}
                    className={`w-9 h-5 rounded-full transition cursor-pointer p-0.5 ${
                      autoSortDates ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        autoSortDates ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-white/50">
                  Keep cards ordered by upcoming deadline automatically.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Add P1 to urgent cards</span>
                  <button
                    type="button"
                    onClick={() => setAutoAddPriority(!autoAddPriority)}
                    className={`w-9 h-5 rounded-full transition cursor-pointer p-0.5 ${
                      autoAddPriority ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        autoAddPriority ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-white/50">
                  Automatically tag cards due within 24 hours with High Priority.
                </p>
              </div>
            </div>
          )}

          {/* ================= PANEL: POWER-UPS ================= */}
          {panel === 'powerups' && (
            <div className="space-y-3 animate-in fade-in">
              <p className="text-xs text-white/60 leading-relaxed">
                Supercharge your board with connected developer & productivity tools.
              </p>

              {[
                { key: 'github' as const, name: 'GitHub Integration', desc: 'Attach commits & pull requests to cards' },
                { key: 'slack' as const, name: 'Slack Alerts', desc: 'Post card updates directly to team channels' },
                { key: 'calendar' as const, name: 'Calendar Mode', desc: 'Sync card deadlines with Google & Outlook' },
                { key: 'webhooks' as const, name: 'Webhooks & Events', desc: 'Stream real-time board events to your API endpoints' },
              ].map((pu) => {
                const active = powerUps[pu.key];
                return (
                  <div
                    key={pu.key}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{pu.name}</p>
                      <p className="text-[10px] text-white/50">{pu.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPowerUps((prev) => ({ ...prev, [pu.key]: !active }));
                        showToast(`${pu.name} ${!active ? 'enabled' : 'disabled'}`);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                        active
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white/70'
                      }`}
                    >
                      {active ? 'Enabled' : 'Enable'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= PANEL: LABELS ================= */}
          {panel === 'labels' && (
            <div className="space-y-3 animate-in fade-in">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block">
                Board Labels
              </span>
              <div className="space-y-1.5">
                {[
                  { id: 'l1', name: 'High Priority', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
                  { id: 'l2', name: 'Feature Release', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                  { id: 'l3', name: 'Bug Fix', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                  { id: 'l4', name: 'Documentation', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
                  { id: 'l5', name: 'Design / UI', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
                ].map((l) => (
                  <div
                    key={l.id}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-semibold ${l.color}`}
                  >
                    <span>{l.name}</span>
                    <Check className="w-3.5 h-3.5 opacity-60" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= PANEL: STICKERS ================= */}
          {panel === 'stickers' && (
            <div className="space-y-3 animate-in fade-in">
              <p className="text-xs text-white/60 leading-relaxed">
                Click a sticker to celebrate milestones and card completions!
              </p>
              <div className="grid grid-cols-4 gap-2.5 pt-2">
                {STICKERS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (onAddSticker) onAddSticker(s);
                      showToast(`Sticker ${s} added!`);
                    }}
                    className="h-14 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 flex items-center justify-center text-2xl hover:scale-110 transition cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================= PANEL: ACTIVITY ================= */}
          {panel === 'activity' && (
            <div className="space-y-3 animate-in fade-in">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block">
                Recent Board Activity
              </span>
              <div className="space-y-2">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1 text-xs"
                  >
                    <p className="text-white/90">
                      <strong className="text-emerald-400">{log.user}</strong> {log.action}
                    </p>
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= PANEL: ARCHIVED ITEMS ================= */}
          {panel === 'archived' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center rounded-lg bg-white/5 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setArchivedTab('cards')}
                  className={`flex-1 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    archivedTab === 'cards' ? 'bg-[#0052cc] text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Cards ({archivedCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setArchivedTab('lists')}
                  className={`flex-1 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    archivedTab === 'lists' ? 'bg-[#0052cc] text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Lists ({archivedLists.length})
                </button>
              </div>

              {/* Search Bar for Archived Items */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" />
                <input
                  type="text"
                  value={archivedSearchQuery}
                  onChange={(e) => setArchivedSearchQuery(e.target.value)}
                  placeholder={archivedTab === 'cards' ? 'Search archived cards...' : 'Search archived lists...'}
                  className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {isLoadingArchived ? (
                <div className="py-8 text-center text-xs text-white/40 italic">
                  Loading archived items...
                </div>
              ) : archivedTab === 'cards' ? (
                <div className="space-y-2">
                  {archivedCards.filter((c) => c.title.toLowerCase().includes(archivedSearchQuery.toLowerCase())).length > 0 ? (
                    archivedCards
                      .filter((c) => c.title.toLowerCase().includes(archivedSearchQuery.toLowerCase()))
                      .map((card) => (
                      <div
                        key={card.id}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{card.title}</p>
                          {card.description && (
                            <p className="text-[10px] text-white/50">{card.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={async () => {
                              if (onRestoreCard) await onRestoreCard(card);
                              setArchivedCards((prev) => prev.filter((c) => c.id !== card.id));
                              showToast(`Restored "${card.title}" to board`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-[11px] font-semibold transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore to board</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteCardPermanently) onDeleteCardPermanently(card.id);
                              setArchivedCards((prev) => prev.filter((c) => c.id !== card.id));
                              showToast('Card deleted permanently');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-rose-400 hover:bg-rose-500/10 text-[11px] transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-white/40 italic">
                      No archived cards
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {archivedLists.filter((l) => l.title.toLowerCase().includes(archivedSearchQuery.toLowerCase())).length > 0 ? (
                    archivedLists
                      .filter((l) => l.title.toLowerCase().includes(archivedSearchQuery.toLowerCase()))
                      .map((list) => (
                      <div
                        key={list.id}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{list.title}</p>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await listService.updateList(list.id, { is_archived: false });
                                setArchivedLists((prev) => prev.filter((l) => l.id !== list.id));
                                if (onRestoreList) onRestoreList(list.id);
                                showToast(`Restored list "${list.title}" to board`);
                              } catch (err) {
                                console.warn('Failed to restore list:', err);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-[11px] font-semibold transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore to board</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-white/40 italic">
                      No archived lists
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 shrink-0 text-center">
          <span className="text-[10px] text-white/40">Quasha Board Engine v2.5</span>
        </div>
      </aside>

      {/* Copy Board Modal */}
      {isCopying && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsCopying(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-5 space-y-4 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">Copy board</h3>
              <button
                type="button"
                onClick={() => setIsCopying(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Title</label>
              <input
                type="text"
                value={copyTitle}
                onChange={(e) => setCopyTitle(e.target.value)}
                placeholder={`Copy of ${board?.title || 'Board'}`}
                className="w-full h-9 rounded-xl border border-white/15 bg-black/40 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCopying(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalTitle = copyTitle.trim() || `Copy of ${board?.title || 'Board'}`;
                  if (onCopyBoard) onCopyBoard(finalTitle);
                  setIsCopying(false);
                  showToast(`Created board "${finalTitle}"!`);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#0052cc] hover:bg-blue-600 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Board Confirmation Modal */}
      {confirmCloseBoard && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setConfirmCloseBoard(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-rose-500/30 p-5 space-y-4 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">Close this board?</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Closing a board archives it. You can reopen closed boards at any time from your dashboard.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCloseBoard(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmCloseBoard(false);
                  if (onCloseBoard) onCloseBoard();
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                Close Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email-to-board Modal */}
      {showEmailModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowEmailModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-5 space-y-4 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Email-to-board</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Send or forward emails to this private address to automatically create cards on this board.
            </p>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-emerald-400 truncate">
              board-{(board?.id || 'main').slice(0, 8)}@inbox.quasha.app
            </div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`board-${(board?.id || 'main').slice(0, 8)}@inbox.quasha.app`);
                  showToast('Board email copied!');
                  setShowEmailModal(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#0052cc] hover:bg-blue-600 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                Copy Address
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BoardMenuDrawer;
