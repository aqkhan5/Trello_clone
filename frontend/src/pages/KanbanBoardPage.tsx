import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Kanban,
  Search,
  Plus,
  Bell,
  HelpCircle,
  ChevronDown,
  Star,
  Share2,
  MoreHorizontal,
  Clock,
  Paperclip,
  AlignLeft,
  CheckSquare,
  Inbox,
  Calendar,
  Layers,
  Filter,
  X,
  User,
  Settings,
  LogOut,
  AlertCircle,
  Loader2,
  MessageSquare,
  Info,
  Workflow,
  Puzzle,
  Pin,
  Eye,
  Pencil,
  Check,
} from 'lucide-react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import CardDetailModal, { getLabelColorClasses, type CardAttachment } from '../components/CardDetailModal';
import ProfileModal from '../components/ProfileModal';
import WorkspaceSettingsModal from '../components/WorkspaceSettingsModal';
import BoardMenuDrawer, { type BoardMenuPanel } from '../components/BoardMenuDrawer';
import InviteMembersModal from '../components/InviteMembersModal';
import ListActionsMenu from '../components/ListActionsMenu';
import { BoardPlannerPanel } from '../components/BoardPlannerPanel';
import { BoardInboxPanel } from '../components/BoardInboxPanel';
import { BoardViewsPopover, type BoardViewMode } from '../components/BoardViewsPopover';
import { BoardViewsCanvas } from '../components/BoardViewsCanvas';
import SwitchBoardsPopover from '../components/SwitchBoardsPopover';
import { CreateBoardModal } from '../components/CreateBoardModal';
import { authService, type UserResponse } from '../services/auth';
import { boardService, type Board } from '../services/boardService';
import { listService } from '../services/listService';
import { cardService } from '../services/cardService';
import { workspaceService, type Workspace } from '../services/workspaceService';
import { getFullFileUrl } from '../services/api';
import StarredBoardsPopover from '../components/StarredBoardsPopover';
import RecentBoardsPopover from '../components/RecentBoardsPopover';
import WorkspacesNavPopover from '../components/WorkspacesNavPopover';
import GlobalSearchModal from '../components/GlobalSearchModal';
import NotificationsPopover from '../components/NotificationsPopover';
import HelpModal from '../components/HelpModal';
import {
  isBoardStarred,
  starBoard,
  unstarBoard,
  recordRecentBoard,
  onBoardNavChange,
} from '../services/boardNavService';

export interface CardTag {
  id: string;
  label: string;
  colorClass: string;
}

export interface KanbanCardItem {
  id: string;
  title: string;
  list_id?: string;
  position?: number;
  tags?: CardTag[];
  coverImage?: string;
  coverColor?: string;
  completed?: boolean;
  dueDate?: string;
  checklist?: { current: number; total: number };
  commentsCount?: number;
  attachmentsCount?: number;
  attachments?: CardAttachment[];
  hasDescription?: boolean;
  assignees?: string[];
  description?: string;
}

export interface KanbanColumnItem {
  id: string;
  title: string;
  cards: KanbanCardItem[];
  position?: number;
}

export const KanbanBoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();

  const [boardStarred, setBoardStarred] = useState<boolean>(() => {
    return boardId ? isBoardStarred(boardId) : false;
  });
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [isStarredOpen, setIsStarredOpen] = useState(false);
  const [isWorkspacesOpen, setIsWorkspacesOpen] = useState(false);
  const recentRef = useRef<HTMLDivElement>(null);
  const starredRef = useRef<HTMLDivElement>(null);
  const workspacesRef = useRef<HTMLDivElement>(null);

  const [isInboxOpen, setIsInboxOpen] = useState(true);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isPlannerFitToScreen, setIsPlannerFitToScreen] = useState(false);
  const [isSwitchBoardsOpen, setIsSwitchBoardsOpen] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [quickInboxText, setQuickInboxText] = useState('');
  const [addingCardColumnId, setAddingCardColumnId] = useState<string | null>(null);
  const [newCardText, setNewCardText] = useState('');
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Panel resize widths (px). Min = default width; user can only stretch wider.
  const INBOX_DEFAULT_WIDTH = 320;
  const PLANNER_DEFAULT_WIDTH = 430;
  const [inboxWidth, setInboxWidth] = useState(INBOX_DEFAULT_WIDTH);
  const [plannerWidth, setPlannerWidth] = useState(PLANNER_DEFAULT_WIDTH);
  const isResizingInbox = useRef(false);
  const isResizingPlanner = useRef(false);

  // Backend & Toast State
  const [board, setBoard] = useState<Board | null>(null);
  const [workspaceData, setWorkspaceData] = useState<Workspace | null>(null);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Background Control (Default to null / System Default)
  const [boardBg, setBoardBg] = useState<string | null>(() => {
    if (!boardId) return null;
    return localStorage.getItem('board_bg_' + boardId) || null;
  });

  const handleBackgroundChange = (newBg: string | null) => {
    setBoardBg(newBg);
    if (!boardId) return;
    if (newBg) {
      localStorage.setItem('board_bg_' + boardId, newBg);
    } else {
      localStorage.removeItem('board_bg_' + boardId);
    }
    if (!boardId.startsWith('board-')) {
      boardService.updateBoard(boardId, { background: newBg || '' }).catch(() => null);
    }
  };

  // Board Menu Drawer State
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
  const [boardMenuPanel, setBoardMenuPanel] = useState<BoardMenuPanel>('main');
  const [isWatchingBoard, setIsWatchingBoard] = useState(false);

  const openBoardMenu = (panel: BoardMenuPanel = 'main') => {
    setBoardMenuPanel(panel);
    setIsBoardMenuOpen(true);
  };

  // View Switcher (Original Trello: Board, Table, Calendar, Timeline, Dashboard, Map)
  const [viewMode, setViewMode] = useState<BoardViewMode>('board');
  const [isViewSwitcherOpen, setIsViewSwitcherOpen] = useState(false);
  const [isWorkspacePremium, setIsWorkspacePremium] = useState(true);
  const viewSwitcherRef = useRef<HTMLDivElement>(null);

  // Star sync & click-outside listener for top bar popovers
  useEffect(() => {
    if (boardId) {
      setBoardStarred(isBoardStarred(boardId));
    }
    const cleanup = onBoardNavChange(() => {
      if (boardId) {
        setBoardStarred(isBoardStarred(boardId));
      }
    });
    return cleanup;
  }, [boardId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) {
        setIsRecentOpen(false);
      }
      if (starredRef.current && !starredRef.current.contains(e.target as Node)) {
        setIsStarredOpen(false);
      }
      if (workspacesRef.current && !workspacesRef.current.contains(e.target as Node)) {
        setIsWorkspacesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Drag-to-resize: panel right-edge handle (stretch only, not compress)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isResizingInbox.current) {
        // Inbox panel starts at left edge (x=0 roughly), width = cursor x minus panel start
        // We just use the movement delta approach via clientX
        setInboxWidth((prev) => {
          const next = prev + e.movementX;
          return Math.max(INBOX_DEFAULT_WIDTH, next);
        });
      }
      if (isResizingPlanner.current) {
        setPlannerWidth((prev) => {
          const next = prev + e.movementX;
          return Math.max(PLANNER_DEFAULT_WIDTH, next);
        });
      }
    };
    const onMouseUp = () => {
      isResizingInbox.current = false;
      isResizingPlanner.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [INBOX_DEFAULT_WIDTH, PLANNER_DEFAULT_WIDTH]);

  const handleToggleBoardStar = () => {
    if (!board && !boardId) return;
    const currentId = board?.id || boardId!;
    const next = !boardStarred;
    setBoardStarred(next);
    if (next) {
      starBoard({
        id: currentId,
        title: board?.title || 'Board',
        workspaceId: board?.workspace_id,
        workspaceName: workspaceData?.name || 'Workspace',
        background: boardBg || (board as any)?.background,
      });
      setToastMessage('⭐ Board added to Starred');
    } else {
      unstarBoard(currentId);
      setToastMessage('Board removed from Starred');
    }
  };

  // Interactive Card Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterLabelId, setFilterLabelId] = useState<string | null>(null);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Top bar Search, Notifications, and Help Modal states
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K for search, ? for help)
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

  // Universal Editing & Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWorkspaceSettingsModalOpen, setIsWorkspaceSettingsModalOpen] = useState(false);
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitleInput, setBoardTitleInput] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState('');
  const [activeListMenuId, setActiveListMenuId] = useState<string | null>(null);
  const [listMenuAnchor, setListMenuAnchor] = useState<HTMLElement | null>(null);

  // List Personalization & Color States (Persistent across reloads and logouts)
  const [listColors, setListColors] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('trello_list_colors');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleChangeListColor = async (columnId: string, color: string | null) => {
    setListColors((prev) => {
      const updated = { ...prev };
      if (color) {
        updated[columnId] = color;
      } else {
        delete updated[columnId];
      }
      try {
        localStorage.setItem('trello_list_colors', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save list colors to localStorage:', e);
      }
      return updated;
    });

    try {
      if (!columnId.startsWith('list-') && !columnId.startsWith('temp-') && !columnId.startsWith('col-')) {
        await listService.updateList(columnId, { color });
      }
    } catch (err) {
      console.warn('Failed to persist list color in database:', err);
    }
  };

  const [pinnedListIds, setPinnedListIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('trello_pinned_lists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleTogglePinList = (columnId: string) => {
    setPinnedListIds((prev) => {
      const isPinned = prev.includes(columnId);
      const updated = isPinned ? prev.filter((id) => id !== columnId) : [...prev, columnId];
      try {
        localStorage.setItem('trello_pinned_lists', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save pinned lists:', e);
      }
      return updated;
    });
  };

  const [watchedListIds, setWatchedListIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('trello_watched_lists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleWatchList = (columnId: string) => {
    setWatchedListIds((prev) => {
      const isWatched = prev.includes(columnId);
      const updated = isWatched ? prev.filter((id) => id !== columnId) : [...prev, columnId];
      try {
        localStorage.setItem('trello_watched_lists', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save watched lists:', e);
      }
      return updated;
    });
  };

  const showErrorToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Selected card for CardDetailModal
  const [selectedCard, setSelectedCard] = useState<{
    card: KanbanCardItem;
    columnTitle: string;
  } | null>(null);

  const [columns, setColumns] = useState<KanbanColumnItem[]>([]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Click outside to close list dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeListMenuId) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-list-menu]')) {
          setActiveListMenuId(null);
        }
      }
    };
    if (activeListMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeListMenuId]);

  // Click outside to close view switcher dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewSwitcherRef.current && !viewSwitcherRef.current.contains(event.target as Node)) {
        setIsViewSwitcherOpen(false);
      }
    };
    if (isViewSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isViewSwitcherOpen]);

  // Fetch board, lists, cards, and current user
  const fetchBoardData = async () => {
    if (!boardId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Concurrently fetch user profile in background
      authService.getMe().then((u) => setCurrentUser(u)).catch(() => null);

      // 1. Fetch board and lists in parallel (eliminate sequential waterfall requests)
      const [boardRes, listsRes] = await Promise.all([
        boardService.getBoardById(boardId),
        listService.getListsByBoard(boardId),
      ]);

      if (boardRes?.workspace_id) {
        workspaceService.getWorkspaceById(boardRes.workspace_id).then((ws) => {
          setWorkspaceData(ws);
          if (boardRes && ws?.name) {
            recordRecentBoard({
              id: boardRes.id,
              title: boardRes.title,
              workspaceId: boardRes.workspace_id,
              workspaceName: ws.name,
              background: boardBg || (boardRes as any).background,
            });
          }
        }).catch(() => null);
      }

      // 2. Single Board Payload Check:
      // If boardService.getBoardById(boardId) already includes lists and cards in its response model,
      // use that directly without firing separate list/card requests.
      const boardPayload = boardRes as any;
      if (
        boardPayload?.lists &&
        Array.isArray(boardPayload.lists) &&
        boardPayload.lists.length > 0 &&
        boardPayload.lists[0]?.cards !== undefined
      ) {
        const directCols: KanbanColumnItem[] = boardPayload.lists.map((list: any) => ({
          id: list.id,
          title: list.title,
          cards: (list.cards || []).map((c: any) => {
            const storedAtts: CardAttachment[] = (() => {
              try {
                const raw = localStorage.getItem('trello_card_attachments_' + c.id);
                return raw ? JSON.parse(raw) : [];
              } catch {
                return [];
              }
            })();
            const attCount = storedAtts.length;
            const coverImg = c.cover_image || (storedAtts.find((a) => a.type === 'image')?.url) || undefined;
            return {
              id: c.id,
              title: c.title,
              list_id: c.list_id || list.id,
              position: typeof c.position === 'number' ? c.position : Number(c.position) || undefined,
              description: c.description || undefined,
              completed: c.is_completed || false,
              hasDescription: Boolean(c.description),
              dueDate: c.due_date ? new Date(c.due_date).toLocaleDateString() : undefined,
              coverColor: c.cover_color || undefined,
              coverImage: coverImg,
              attachmentsCount: attCount > 0 ? attCount : undefined,
              attachments: storedAtts,
              tags: [],
            };
          }),
        }));

        setBoard(boardRes);
        if (boardRes?.background) {
          setBoardBg(boardRes.background);
          localStorage.setItem('board_bg_' + boardRes.id, boardRes.background);
        }
        setColumns(directCols);
        setBoardStarred(isBoardStarred(boardRes.id));
        recordRecentBoard({
          id: boardRes.id,
          title: boardRes.title,
          workspaceId: boardRes.workspace_id,
          workspaceName: workspaceData?.name || 'Workspace',
          background: boardBg || (boardRes as any).background,
        });
        setIsLoading(false);
        return;
      }

      // If no lists exist on this board, update state once and return immediately
      if (!listsRes || listsRes.length === 0) {
        setBoard(boardRes);
        setColumns([]);
        setIsLoading(false);
        return;
      }

      // 3. Fetch cards for all lists simultaneously using Promise.all
      const cardsByList = await Promise.all(
        listsRes.map((list: any) => cardService.getCardsByList(list.id).catch(() => []))
      );

      // Extract list colors from backend
      const loadedListColors: Record<string, string> = {};
      listsRes.forEach((l: any) => {
        if (l.color) {
          loadedListColors[l.id] = l.color;
        }
      });
      if (Object.keys(loadedListColors).length > 0) {
        setListColors((prev) => ({ ...prev, ...loadedListColors }));
      }

      // Fetch labels, members, and attachments for cards in parallel
      const cardsByListWithMeta = await Promise.all(
        cardsByList.map((cards: any[]) =>
          Promise.all(
            cards.map(async (c: any) => {
              if (c.id && !c.id.startsWith('card-')) {
                const [cardLabels, cardMembers, cardAtts] = await Promise.all([
                  cardService.getCardLabels(c.id).catch(() => []),
                  cardService.getCardMembers(c.id).catch(() => []),
                  cardService.getCardAttachments(c.id).catch(() => []),
                ]);
                return {
                  ...c,
                  loadedLabels: cardLabels,
                  loadedMembers: cardMembers,
                  loadedAttachments: cardAtts,
                };
              }
              return c;
            })
          )
        )
      );

      // Combine the lists with their cards
      const combinedCols: KanbanColumnItem[] = listsRes.map((list: any, idx: number) => {
        const cards = cardsByListWithMeta[idx] || [];
        return {
          id: list.id,
          title: list.title,
          position: typeof list.position === 'number' ? list.position : Number(list.position) || (idx + 1) * 65536,
          cards: cards.map((c: any) => {
            const tags: CardTag[] = (c.loadedLabels || []).map((l: any) => {
              const col = getLabelColorClasses(l.color);
              return {
                id: l.id,
                label: l.name,
                colorClass: `${col.bg} ${col.text} ${col.border}`,
              };
            });
            const assignees: string[] = (c.loadedMembers || []).map(
              (m: any) => m.user?.avatar_url || m.user?.full_name || 'Member'
            );
            const storedAtts: CardAttachment[] = (() => {
              try {
                const raw = localStorage.getItem('trello_card_attachments_' + c.id);
                return raw ? JSON.parse(raw) : [];
              } catch {
                return [];
              }
            })();
            const finalAtts: CardAttachment[] =
              c.loadedAttachments && c.loadedAttachments.length > 0
                ? c.loadedAttachments.map((a: any) => {
                    const isImg =
                      a.content_type?.startsWith('image/') ||
                      /\.(png|jpe?g|gif|webp|svg)$/i.test(a.file_name);
                    const rawUrl = a.file_url || '';
                    const fullUrl = getFullFileUrl(rawUrl);
                    return {
                      id: a.id,
                      name: a.file_name,
                      size: `${(a.file_size / 1024).toFixed(1)} KB`,
                      uploadedAt: new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                      url: fullUrl,
                      type: isImg ? 'image' : a.content_type === 'text/html' ? 'link' : 'file',
                    };
                  })
                : storedAtts;
            const attCount = finalAtts.length;
            const coverImg = c.cover_image || (finalAtts.find((a) => a.type === 'image')?.url) || undefined;
            return {
              id: c.id,
              title: c.title,
              list_id: c.list_id || list.id,
              position: typeof c.position === 'number' ? c.position : Number(c.position) || undefined,
              description: c.description || undefined,
              completed: c.is_completed || false,
              coverColor: c.cover_color || undefined,
              coverImage: coverImg,
              hasDescription: Boolean(c.description),
              dueDate: c.due_date ? new Date(c.due_date).toLocaleDateString() : undefined,
              attachmentsCount: attCount > 0 ? attCount : undefined,
              attachments: finalAtts,
              tags,
              assignees,
            };
          }),
        };
      });

      // Update state once, then immediately set isLoading(false)
      setBoard(boardRes);
      if (boardRes?.background) {
        setBoardBg(boardRes.background);
        localStorage.setItem('board_bg_' + boardRes.id, boardRes.background);
      }
      setColumns(combinedCols);
      if (boardRes) {
        setBoardStarred(isBoardStarred(boardRes.id));
        recordRecentBoard({
          id: boardRes.id,
          title: boardRes.title,
          workspaceId: boardRes.workspace_id,
          workspaceName: workspaceData?.name || 'Workspace',
          background: boardBg || (boardRes as any).background,
        });
      }
      setIsLoading(false);
    } catch (err: any) {
      console.warn('Failed to load board data:', err);
      const is404 = err?.response?.status === 404;
      const detail = is404
        ? 'Board not found. This board does not exist, has been deleted, or you do not have permission to view it.'
        : err?.response?.data?.detail || err?.message || 'Failed to sync with backend server.';
      setErrorMessage(detail);
      setBoard(null);
      setColumns([]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [boardId]);

  // ==========================================
  // Drag & Drop Reordering Handler (Lists & Cards)
  // ==========================================
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // Dropped outside a valid target
    if (!destination) return;

    // Dropped in the exact same location
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Save previous state snapshot for rollback on error
    const previousColumns = columns.map((col) => ({
      ...col,
      cards: [...col.cards],
    }));

    // ----------------------------------------------------
    // CASE A: Reordering Lists (type === 'LIST')
    // ----------------------------------------------------
    if (type === 'LIST') {
      const reorderedColumns = Array.from(columns);
      const [movedColumn] = reorderedColumns.splice(source.index, 1);
      reorderedColumns.splice(destination.index, 0, movedColumn);

      // Compute fractional position
      const prevCol = destination.index > 0 ? reorderedColumns[destination.index - 1] : null;
      const nextCol = destination.index < reorderedColumns.length - 1 ? reorderedColumns[destination.index + 1] : null;
      const prevPos = prevCol?.position !== undefined ? Number(prevCol.position) : NaN;
      const nextPos = nextCol?.position !== undefined ? Number(nextCol.position) : NaN;

      let targetPosition: number;
      if (!isNaN(prevPos) && !isNaN(nextPos)) {
        targetPosition = Number(((prevPos + nextPos) / 2).toFixed(6));
      } else if (!isNaN(prevPos)) {
        targetPosition = Number((prevPos + 65536).toFixed(6));
      } else if (!isNaN(nextPos)) {
        targetPosition = Number((nextPos / 2).toFixed(6));
      } else {
        targetPosition = (destination.index + 1) * 65536;
      }

      movedColumn.position = targetPosition;

      // Optimistic state update
      setColumns(reorderedColumns);

      try {
        if (boardId && !boardId.startsWith('board-')) {
          await listService.moveList(draggableId, { position: targetPosition });
        }
      } catch (err: any) {
        console.warn('Failed to persist list move on backend:', err);
        setColumns(previousColumns);
        showErrorToast(
          err?.response?.data?.detail || 'Failed to move list on server. Reverting.'
        );
      }
      return;
    }

    // ----------------------------------------------------
    // CASE B: Moving Cards (type === 'CARD')
    // ----------------------------------------------------
    if (type === 'CARD') {
      const sourceColIndex = columns.findIndex((c) => c.id === source.droppableId);
      const destColIndex = columns.findIndex((c) => c.id === destination.droppableId);

      if (sourceColIndex === -1 || destColIndex === -1) return;

      const sourceCol = columns[sourceColIndex];
      const destCol = columns[destColIndex];

      let targetPosition: number = (destination.index + 1) * 65536;

      if (source.droppableId === destination.droppableId) {
        // Intra-list card movement
        const newCards = Array.from(sourceCol.cards);
        const [movedCard] = newCards.splice(source.index, 1);
        if (!movedCard) return;

        // Calculate target position
        const prevCard = destination.index > 0 ? newCards[destination.index - 1] : null;
        const nextCard = destination.index < newCards.length ? newCards[destination.index] : null;
        const prevPos = prevCard?.position !== undefined ? Number(prevCard.position) : NaN;
        const nextPos = nextCard?.position !== undefined ? Number(nextCard.position) : NaN;

        if (!isNaN(prevPos) && !isNaN(nextPos)) {
          targetPosition = Number(((prevPos + nextPos) / 2).toFixed(6));
        } else if (!isNaN(prevPos)) {
          targetPosition = Number((prevPos + 65536).toFixed(6));
        } else if (!isNaN(nextPos)) {
          targetPosition = Number((nextPos / 2).toFixed(6));
        } else {
          targetPosition = (destination.index + 1) * 65536;
        }

        const updatedCard: KanbanCardItem = {
          ...movedCard,
          position: targetPosition,
        };
        newCards.splice(destination.index, 0, updatedCard);

        const newColumns = columns.map((col) =>
          col.id === source.droppableId ? { ...col, cards: newCards } : col
        );
        setColumns(newColumns);
      } else {
        // Cross-list card transfer
        const sourceCards = Array.from(sourceCol.cards);
        const destCards = Array.from(destCol.cards);
        const [movedCard] = sourceCards.splice(source.index, 1);
        if (!movedCard) return;

        // Calculate target position in destination list
        const prevCard = destination.index > 0 ? destCards[destination.index - 1] : null;
        const nextCard = destination.index < destCards.length ? destCards[destination.index] : null;
        const prevPos = prevCard?.position !== undefined ? Number(prevCard.position) : NaN;
        const nextPos = nextCard?.position !== undefined ? Number(nextCard.position) : NaN;

        if (!isNaN(prevPos) && !isNaN(nextPos)) {
          targetPosition = Number(((prevPos + nextPos) / 2).toFixed(6));
        } else if (!isNaN(prevPos)) {
          targetPosition = Number((prevPos + 65536).toFixed(6));
        } else if (!isNaN(nextPos)) {
          targetPosition = Number((nextPos / 2).toFixed(6));
        } else {
          targetPosition = (destination.index + 1) * 65536;
        }

        // CRITICAL: Update the card's list identifier to match the destination list
        const updatedCard: KanbanCardItem = {
          ...movedCard,
          list_id: destination.droppableId,
          position: targetPosition,
        };
        destCards.splice(destination.index, 0, updatedCard);

        // Update state immutably so both columns re-render with their updated .cards arrays
        const newColumns = columns.map((col) => {
          if (col.id === source.droppableId) {
            return { ...col, cards: sourceCards };
          }
          if (col.id === destination.droppableId) {
            return { ...col, cards: destCards };
          }
          return col;
        });

        setColumns(newColumns);
      }

      try {
        if (!draggableId.startsWith('card-')) {
          await cardService.moveCard(draggableId, {
            list_id: destination.droppableId,
            position: targetPosition,
          });
        }
      } catch (err: any) {
        console.warn('Failed to persist card move on backend:', err);
        setColumns(previousColumns);
        showErrorToast(
          err?.response?.data?.detail || 'Failed to move card on server. Reverting.'
        );
      }
    }
  };

  const handleAddCardSubmit = async (columnId: string) => {
    if (!newCardText.trim()) return;
    const col = columns.find((c) => c.id === columnId);
    const cardPos = (col?.cards.length || 0) + 1;

    try {
      const created = await cardService.createCard({
        list_id: columnId,
        title: newCardText.trim(),
        position: cardPos,
      });

      setColumns((prev) =>
        prev.map((c) => {
          if (c.id === columnId) {
            return {
              ...c,
              cards: [
                ...c.cards,
                {
                  id: created.id,
                  title: created.title,
                  description: created.description || undefined,
                  completed: created.is_completed || false,
                  coverColor: created.cover_color || undefined,
                  coverImage: created.cover_image || undefined,
                  hasDescription: Boolean(created.description),
                  tags: [],
                  assignees: [],
                },
              ],
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.warn('Creating card on backend failed, appending locally:', err);
      // Fallback local append
      setColumns((prev) =>
        prev.map((c) => {
          if (c.id === columnId) {
            return {
              ...c,
              cards: [
                ...c.cards,
                {
                  id: `card-${Date.now()}`,
                  title: newCardText.trim(),
                  tags: [],
                  assignees: [],
                },
              ],
            };
          }
          return c;
        })
      );
    } finally {
      setNewCardText('');
      setAddingCardColumnId(null);
    }
  };

  const handleAddCardWithDate = async (columnId: string, title: string, dueDate: Date) => {
    if (!title.trim()) return;
    const col = columns.find((c) => c.id === columnId) || columns[0];
    if (!col) return;
    const cardPos = (col.cards.length || 0) + 1;
    const dateIso = dueDate.toISOString();
    const dateFormatted = dueDate.toLocaleDateString();

    try {
      const created = await cardService.createCard({
        list_id: col.id,
        title: title.trim(),
        position: cardPos,
        due_date: dateIso,
      });

      setColumns((prev) =>
        prev.map((c) => {
          if (c.id === col.id) {
            return {
              ...c,
              cards: [
                ...c.cards,
                {
                  id: created.id,
                  title: created.title,
                  list_id: col.id,
                  description: created.description || undefined,
                  completed: created.is_completed || false,
                  coverColor: created.cover_color || undefined,
                  coverImage: created.cover_image || undefined,
                  hasDescription: Boolean(created.description),
                  dueDate: dateFormatted,
                  tags: [],
                  assignees: [],
                },
              ],
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.warn('Backend create card with date failed:', err);
      setColumns((prev) =>
        prev.map((c) => {
          if (c.id === col.id) {
            return {
              ...c,
              cards: [
                ...c.cards,
                {
                  id: `card-${Date.now()}`,
                  title: title.trim(),
                  list_id: col.id,
                  dueDate: dateFormatted,
                  tags: [],
                  assignees: [],
                },
              ],
            };
          }
          return c;
        })
      );
    }
  };

  const handleQuickAddInbox = async (customText?: string) => {
    const text = (customText ?? quickInboxText).trim();
    if (!text || columns.length === 0) return;
    const targetCol = columns[0];
    setQuickInboxText('');
    const cardPos = targetCol.cards.length + 1;
    try {
      const created = await cardService.createCard({
        list_id: targetCol.id,
        title: text,
        position: cardPos,
      });
      setColumns((prev) =>
        prev.map((c) =>
          c.id === targetCol.id
            ? {
                ...c,
                cards: [
                  ...c.cards,
                  {
                    id: created.id,
                    title: created.title,
                    list_id: targetCol.id,
                    completed: false,
                    hasDescription: false,
                    tags: [],
                    assignees: [],
                  },
                ],
              }
            : c
        )
      );
    } catch (err) {
      console.warn('Quick add to inbox failed:', err);
      setColumns((prev) =>
        prev.map((c) =>
          c.id === targetCol.id
            ? {
                ...c,
                cards: [
                  ...c.cards,
                  {
                    id: `card-${Date.now()}`,
                    title: text,
                    list_id: targetCol.id,
                    completed: false,
                    tags: [],
                    assignees: [],
                  },
                ],
              }
            : c
        )
      );
    }
  };

  const handleCreateBoard = async (boardData: { title: string; background: string; visibility: string }) => {
    const wsId = workspaceData?.id || board?.workspace_id;
    if (!wsId) return;
    try {
      const created = await boardService.createBoard({
        title: boardData.title,
        workspace_id: wsId,
        visibility: boardData.visibility,
      });
      if (boardData.background) {
        localStorage.setItem('board_bg_' + created.id, boardData.background);
      }
      window.location.href = `/board/${created.id}`;
    } catch (err: any) {
      showErrorToast(err?.response?.data?.detail || 'Failed to create board.');
    }
  };

  const handleAddListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      if (boardId && !boardId.startsWith('board-')) {
        const created = await listService.createList({
          board_id: boardId,
          title: newListTitle.trim(),
        });

        setColumns((prev) => [
          ...prev,
          {
            id: created.id,
            title: created.title,
            position:
              typeof created.position === 'number'
                ? created.position
                : Number(created.position) || (columns.length + 1) * 65536,
            cards: [],
          },
        ]);
      } else {
        setColumns((prev) => [
          ...prev,
          {
            id: `col-${Date.now()}`,
            title: newListTitle.trim(),
            position: (columns.length + 1) * 65536,
            cards: [],
          },
        ]);
      }
    } catch (err) {
      console.warn('Creating list on backend failed, creating locally:', err);
      setColumns((prev) => [
        ...prev,
        {
          id: `col-${Date.now()}`,
          title: newListTitle.trim(),
          cards: [],
        },
      ]);
    } finally {
      setNewListTitle('');
      setAddingList(false);
    }
  };

  const handleRenameBoard = async (newTitle: string) => {
    setIsEditingBoardTitle(false);
    const trimmed = newTitle.trim();
    if (!trimmed || !board || trimmed === board.title) return;

    setBoard((prev) => (prev ? { ...prev, title: trimmed } : null));

    try {
      if (boardId && !boardId.startsWith('board-')) {
        await boardService.updateBoard(boardId, { title: trimmed });
      }
    } catch (err: any) {
      console.warn('Failed to rename board on backend:', err);
      showErrorToast(err?.response?.data?.detail || 'Failed to rename board on server.');
    }
  };

  const handleRenameList = async (listId: string, newTitle: string) => {
    setEditingListId(null);
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setColumns((prev) =>
      prev.map((col) => (col.id === listId ? { ...col, title: trimmed } : col))
    );

    try {
      if (!listId.startsWith('col-')) {
        await listService.updateList(listId, { title: trimmed });
      }
    } catch (err: any) {
      console.warn('Failed to rename list on backend:', err);
      showErrorToast(err?.response?.data?.detail || 'Failed to rename list on server.');
    }
  };

  const handleCopyList = async (columnId: string, newTitle: string) => {
    setActiveListMenuId(null);
    const sourceCol = columns.find((c) => c.id === columnId);
    if (!sourceCol || !boardId) return;

    const tempId = `col-${Date.now()}`;
    const sourceCards = [...sourceCol.cards];

    setColumns((prev) => {
      const sourceIndex = prev.findIndex((c) => c.id === columnId);
      const newCol: KanbanColumnItem = {
        id: tempId,
        title: newTitle,
        cards: sourceCards.map((c, i) => ({
          ...c,
          id: `card-copy-${Date.now()}-${i}`,
          list_id: tempId,
        })),
      };
      const updated = [...prev];
      updated.splice(sourceIndex + 1, 0, newCol);
      return updated;
    });

    if (listColors[columnId]) {
      handleChangeListColor(tempId, listColors[columnId]);
    }

    try {
      if (!boardId.startsWith('board-')) {
        const createdList = await listService.createList({
          title: newTitle,
          board_id: boardId,
        });

        if (listColors[columnId]) {
          handleChangeListColor(createdList.id, listColors[columnId]);
        }

        const createdCards = await Promise.all(
          sourceCards.map((c) =>
            cardService
              .createCard({
                list_id: createdList.id,
                title: c.title,
                description: c.description,
                due_date: c.dueDate,
              })
              .catch(() => null)
          )
        );

        setColumns((prev) =>
          prev.map((c) =>
            c.id === tempId
              ? {
                  id: createdList.id,
                  title: createdList.title,
                  cards: createdCards.filter(Boolean).map((card: any) => ({
                    id: card.id,
                    title: card.title,
                    list_id: createdList.id,
                    description: card.description || undefined,
                    completed: card.is_completed || false,
                    dueDate: card.due_date ? new Date(card.due_date).toLocaleDateString() : undefined,
                    tags: [],
                  })),
                }
              : c
          )
        );
      }
    } catch (err) {
      console.warn('Backend copy list failed, keeping local copy:', err);
    }
  };

  const handleMoveListPosition = async (columnId: string, targetPosition: number) => {
    setActiveListMenuId(null);
    const targetIndex = targetPosition - 1;
    const currentIndex = columns.findIndex((c) => c.id === columnId);
    if (currentIndex === -1 || currentIndex === targetIndex) return;

    const reordered = Array.from(columns);
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setColumns(reordered);

    try {
      if (boardId && !boardId.startsWith('board-') && !columnId.startsWith('col-')) {
        await listService.moveList(columnId, { position: targetPosition });
      }
    } catch (err) {
      console.warn('Backend move list failed:', err);
    }
  };

  const handleMoveAllCards = async (sourceColumnId: string, targetColumnId: string) => {
    setActiveListMenuId(null);
    const sourceCol = columns.find((c) => c.id === sourceColumnId);
    if (!sourceCol || sourceCol.cards.length === 0) return;

    const cardsToMove = [...sourceCol.cards];
    const targetCol = columns.find((c) => c.id === targetColumnId);
    const startingPos = (targetCol?.cards.length || 0) + 1;

    setColumns((prev) =>
      prev.map((c) => {
        if (c.id === sourceColumnId) {
          return { ...c, cards: [] };
        }
        if (c.id === targetColumnId) {
          return {
            ...c,
            cards: [
              ...c.cards,
              ...cardsToMove.map((card) => ({ ...card, list_id: targetColumnId })),
            ],
          };
        }
        return c;
      })
    );

    try {
      await Promise.all(
        cardsToMove.map((card, idx) => {
          if (!card.id.startsWith('card-') && !targetColumnId.startsWith('col-')) {
            return cardService
              .moveCard(card.id, {
                list_id: targetColumnId,
                position: (startingPos + idx) * 65536,
              })
              .catch((err) => {
                console.warn(`Failed to move card ${card.id} to list ${targetColumnId}:`, err);
                return null;
              });
          }
          return Promise.resolve();
        })
      );
    } catch (err) {
      console.warn('Failed to sync move all cards:', err);
    }
  };

  const handleSortCards = (
    columnId: string,
    sortBy: 'newest' | 'oldest' | 'alpha' | 'due_date'
  ) => {
    setActiveListMenuId(null);
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id !== columnId) return col;
        const sorted = [...col.cards].sort((a, b) => {
          if (sortBy === 'alpha') {
            return a.title.localeCompare(b.title);
          }
          if (sortBy === 'newest') {
            return b.id.localeCompare(a.id);
          }
          if (sortBy === 'oldest') {
            return a.id.localeCompare(b.id);
          }
          if (sortBy === 'due_date') {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          return 0;
        });
        return { ...col, cards: sorted };
      })
    );
  };

  const handleArchiveList = async (listId: string) => {
    setActiveListMenuId(null);
    setColumns((prev) => prev.filter((col) => col.id !== listId));

    try {
      if (!listId.startsWith('col-')) {
        await listService.updateList(listId, { is_archived: true });
      }
    } catch (err) {
      console.warn('Backend archive list failed:', err);
    }
  };

  const handleArchiveAllCards = async (columnId: string) => {
    setActiveListMenuId(null);
    const col = columns.find((c) => c.id === columnId);
    if (!col || col.cards.length === 0) return;

    const cardsToArchive = [...col.cards];

    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, cards: [] } : c))
    );

    try {
      await Promise.all(
        cardsToArchive.map((card) => {
          if (!card.id.startsWith('card-')) {
            return cardService.updateCard(card.id, { is_archived: true }).catch(() => null);
          }
          return Promise.resolve();
        })
      );
    } catch (err) {
      console.warn('Backend archive all cards failed:', err);
    }
  };

  const handleUpdateBoardDescription = async (desc: string) => {
    setBoard((prev) => (prev ? { ...prev, description: desc } : null));
    try {
      if (boardId && !boardId.startsWith('board-')) {
        await boardService.updateBoard(boardId, { description: desc } as any);
      }
    } catch (err) {
      console.warn('Failed to update board description:', err);
    }
  };

  const handleUpdateBoardVisibility = async (visibility: string) => {
    setBoard((prev) => (prev ? { ...prev, visibility } : null));
    try {
      if (boardId && !boardId.startsWith('board-')) {
        await boardService.updateBoard(boardId, { visibility });
      }
    } catch (err) {
      console.warn('Failed to update board visibility:', err);
    }
  };

  const handleCloseBoard = async () => {
    try {
      if (boardId && !boardId.startsWith('board-')) {
        await boardService.deleteBoard(boardId);
      }
    } catch (err) {
      console.warn('Failed to delete board:', err);
    }
    window.location.href = '/dashboard';
  };

  const handleCopyBoard = async (newTitle: string) => {
    try {
      if (!board) return;
      const created = await boardService.createBoard({
        title: newTitle,
        workspace_id: board.workspace_id,
        visibility: board.visibility,
        background: boardBg || undefined,
      });
      window.location.href = `/board/${created.id}`;
    } catch (err: any) {
      showErrorToast(err?.response?.data?.detail || 'Failed to copy board.');
    }
  };

  const handleRestoreCard = async (card: KanbanCardItem) => {
    let targetListId = card.list_id;
    const matchingCol = columns.find((c) => c.id === targetListId);
    if (!matchingCol && columns.length > 0) {
      targetListId = columns[0].id;
    }

    if (targetListId) {
      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === targetListId) {
            const exists = col.cards.some((c) => c.id === card.id);
            if (exists) return col;
            return {
              ...col,
              cards: [{ ...card, list_id: targetListId }, ...col.cards],
            };
          }
          return col;
        })
      );
    }

    try {
      if (!card.id.startsWith('card-')) {
        await cardService.updateCard(card.id, { is_archived: false });
        if (targetListId && card.list_id !== targetListId) {
          await cardService.moveCard(card.id, { list_id: targetListId });
        }
      }
    } catch (err: any) {
      console.warn('Failed to restore card on backend:', err);
      showErrorToast('Failed to sync restored card with server.');
    }
  };

  const handleArchiveCard = async (cardId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      }))
    );
    if (selectedCard && selectedCard.card.id === cardId) {
      setSelectedCard(null);
    }
    try {
      if (!cardId.startsWith('card-')) {
        await cardService.updateCard(cardId, { is_archived: true });
      }
    } catch (err: any) {
      console.warn('Failed to archive card on backend:', err);
      showErrorToast('Failed to archive card on server.');
    }
  };

  const handleRestoreList = async (listId: string) => {
    try {
      if (!listId.startsWith('col-')) {
        await listService.updateList(listId, { is_archived: false });
      }
      await fetchBoardData();
    } catch (err: any) {
      console.warn('Failed to restore list on backend:', err);
      showErrorToast('Failed to restore list.');
    }
  };

  const handleDeleteCardPermanently = (cardId: string) => {
    handleDeleteCard(cardId);
  };

  const handleAddSticker = (sticker: string) => {
    showErrorToast(`Sticker ${sticker} applied to board!`);
  };

  const handleCardClick = async (cardItem: KanbanCardItem, columnTitle: string) => {
    setSelectedCard({ card: cardItem, columnTitle });
    if (!cardItem.id.startsWith('card-')) {
      try {
        const [fullCard, labels, members] = await Promise.all([
          cardService.getCardById(cardItem.id).catch(() => null),
          cardService.getCardLabels(cardItem.id).catch(() => []),
          cardService.getCardMembers(cardItem.id).catch(() => []),
        ]);

        const cardTags: CardTag[] =
          labels && labels.length > 0
            ? labels.map((l: any) => {
                const col = getLabelColorClasses(l.color);
                return {
                  id: l.id,
                  label: l.name,
                  colorClass: `${col.bg} ${col.text} ${col.border}`,
                };
              })
            : cardItem.tags || [];

        const assignees: string[] =
          members && members.length > 0
            ? members.map((m: any) => m.user?.avatar_url || m.user?.full_name || 'Member')
            : cardItem.assignees || [];

        if (fullCard || cardTags.length > 0 || assignees.length > 0) {
          const updatedCardObj: KanbanCardItem = {
            id: fullCard?.id || cardItem.id,
            title: fullCard?.title || cardItem.title,
            description: fullCard?.description !== undefined ? (fullCard.description || undefined) : cardItem.description,
            completed: fullCard?.is_completed !== undefined ? fullCard.is_completed : cardItem.completed,
            hasDescription: Boolean(fullCard?.description || cardItem.description),
            dueDate: fullCard?.due_date ? new Date(fullCard.due_date).toLocaleDateString() : cardItem.dueDate,
            coverColor: fullCard?.cover_color || cardItem.coverColor,
            coverImage: fullCard?.cover_image || cardItem.coverImage,
            tags: cardTags,
            assignees,
            checklist: cardItem.checklist,
          };

          setSelectedCard({
            columnTitle,
            card: updatedCardObj,
          });

          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              cards: col.cards.map((c) => (c.id === cardItem.id ? { ...c, tags: cardTags, assignees } : c)),
            }))
          );
        }
      } catch {
        // Continue with existing card data
      }
    }
  };

  const handleDeleteCard = async (cardIdToDelete: string) => {
    try {
      if (!cardIdToDelete.startsWith('card-')) {
        await cardService.deleteCard(cardIdToDelete);
      }
    } catch (err) {
      console.warn('Backend delete failed, removing locally:', err);
    }
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.filter((card) => card.id !== cardIdToDelete),
      }))
    );
    setSelectedCard(null);
  };

  const handleUpdateCard = async (
    id: string,
    updates: {
      title?: string;
      description?: string;
      due_date?: string | null;
      dueDate?: string;
      tags?: CardTag[];
      assignees?: string[];
      coverColor?: string | null;
      coverImage?: string | null;
      completed?: boolean;
      is_completed?: boolean;
      attachmentsCount?: number;
      attachments?: CardAttachment[];
    }
  ) => {
    try {
      if (!id.startsWith('card-')) {
        await cardService.updateCard(id, {
          title: updates.title,
          description: updates.description,
          due_date: updates.due_date,
          is_completed:
            updates.is_completed !== undefined
              ? updates.is_completed
              : updates.completed !== undefined
              ? updates.completed
              : undefined,
          cover_color: updates.coverColor !== undefined ? updates.coverColor : undefined,
          cover_image: updates.coverImage !== undefined ? updates.coverImage : undefined,
        });
      }
    } catch (err) {
      console.warn('Backend update failed:', err);
    }
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === id
            ? {
                ...c,
                ...updates,
                attachmentsCount:
                  updates.attachmentsCount !== undefined
                    ? updates.attachmentsCount
                    : updates.attachments
                    ? updates.attachments.length
                    : c.attachmentsCount,
                attachments:
                  updates.attachments !== undefined
                    ? updates.attachments
                    : c.attachments,
                tags: updates.tags !== undefined ? updates.tags : c.tags,
                assignees: updates.assignees !== undefined ? updates.assignees : c.assignees,
                completed:
                  updates.completed !== undefined
                    ? updates.completed
                    : updates.is_completed !== undefined
                    ? updates.is_completed
                    : c.completed,
                coverColor:
                  updates.coverColor !== undefined
                    ? (updates.coverColor || undefined)
                    : c.coverColor,
                coverImage:
                  updates.coverImage !== undefined
                    ? (updates.coverImage || undefined)
                    : c.coverImage,
                dueDate:
                  updates.dueDate !== undefined
                    ? updates.dueDate
                    : updates.due_date
                    ? new Date(updates.due_date).toLocaleDateString()
                    : updates.due_date === null
                    ? undefined
                    : c.dueDate,
                hasDescription: Boolean(updates.description ?? c.description),
              }
            : c
        ),
      }))
    );
    setSelectedCard((prev) =>
      prev && prev.card.id === id
        ? {
            ...prev,
            card: {
              ...prev.card,
              ...updates,
              attachmentsCount:
                updates.attachmentsCount !== undefined
                  ? updates.attachmentsCount
                  : updates.attachments
                  ? updates.attachments.length
                  : prev.card.attachmentsCount,
              attachments:
                updates.attachments !== undefined
                  ? updates.attachments
                  : prev.card.attachments,
              completed:
                updates.completed !== undefined
                  ? updates.completed
                  : updates.is_completed !== undefined
                  ? updates.is_completed
                  : prev.card.completed,
              coverColor:
                updates.coverColor !== undefined
                  ? (updates.coverColor || undefined)
                  : prev.card.coverColor,
              coverImage:
                updates.coverImage !== undefined
                  ? (updates.coverImage || undefined)
                  : prev.card.coverImage,
              dueDate:
                updates.dueDate !== undefined
                  ? updates.dueDate
                  : updates.due_date
                  ? new Date(updates.due_date).toLocaleDateString()
                  : updates.due_date === null
                  ? undefined
                  : prev.card.dueDate,
              hasDescription: Boolean(updates.description ?? prev.card.description),
            },
          }
        : prev
    );
  };

  const handleToggleCardComplete = async (cardId: string, currentCompleted?: boolean) => {
    const nextCompleted = !currentCompleted;
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.id === cardId ? { ...c, completed: nextCompleted } : c)),
      }))
    );
    if (selectedCard && selectedCard.card.id === cardId) {
      setSelectedCard((prev) =>
        prev ? { ...prev, card: { ...prev.card, completed: nextCompleted } } : prev
      );
    }
    try {
      if (!cardId.startsWith('card-')) {
        await cardService.updateCard(cardId, { is_completed: nextCompleted });
      }
    } catch (err) {
      console.warn('Failed to toggle completion on backend:', err);
    }
  };

  const handleMoveCardToList = async (cardId: string, targetListId: string) => {
    const targetCol = columns.find((c) => c.id === targetListId);
    if (!targetCol) return;

    setColumns((prev) => {
      let movedCard: KanbanCardItem | null = null;
      const nextCols = prev.map((col) => {
        const found = col.cards.find((c) => c.id === cardId);
        if (found) {
          movedCard = { ...found, list_id: targetListId };
          return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        }
        return col;
      });

      if (movedCard) {
        return nextCols.map((col) =>
          col.id === targetListId ? { ...col, cards: [...col.cards, movedCard!] } : col
        );
      }
      return nextCols;
    });

    if (selectedCard && selectedCard.card.id === cardId) {
      setSelectedCard((prev) =>
        prev
          ? {
              ...prev,
              columnTitle: targetCol.title,
              card: { ...prev.card, list_id: targetListId },
            }
          : null
      );
    }

    try {
      if (!cardId.startsWith('card-') && !targetListId.startsWith('col-')) {
        await cardService.moveCard(cardId, {
          list_id: targetListId,
          position: targetCol.cards.length + 1,
        });
      }
    } catch (err) {
      console.warn('Failed to persist move card to list:', err);
    }
  };

  // Derive unique board labels for quick filtering
  const allBoardLabels = useMemo(() => {
    const map = new Map<string, { id: string; label: string; colorClass: string }>();
    columns.forEach((col) => {
      col.cards.forEach((card) => {
        card.tags?.forEach((t) => {
          if (!map.has(t.id)) {
            map.set(t.id, t);
          }
        });
      });
    });
    return Array.from(map.values());
  }, [columns]);

  // Real-time filtered and pinned columns based on keyword and label selection
  const filteredColumns = useMemo(() => {
    let result = columns;

    if (filterKeyword.trim() || filterLabelId) {
      const query = filterKeyword.toLowerCase().trim();
      result = result.map((col) => ({
        ...col,
        cards: col.cards.filter((card) => {
          if (query) {
            const matchesTitle = card.title?.toLowerCase().includes(query);
            const matchesDesc = card.description?.toLowerCase().includes(query);
            if (!matchesTitle && !matchesDesc) return false;
          }
          if (filterLabelId) {
            const matchesLabel = card.tags?.some(
              (t) => t.id === filterLabelId || t.label.toLowerCase() === filterLabelId.toLowerCase()
            );
            if (!matchesLabel) return false;
          }
          return true;
        }),
      }));
    }

    if (pinnedListIds.length > 0) {
      return [...result].sort((a, b) => {
        const aPinned = pinnedListIds.includes(a.id);
        const bPinned = pinnedListIds.includes(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
    }

    return result;
  }, [columns, filterKeyword, filterLabelId, pinnedListIds]);

  // Graceful Fallback if board fails to load or 404s
  if (!isLoading && !board) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-zinc-950 font-sans text-white select-none">
        {/* Top Navbar */}
        <header className="relative z-30 flex h-12 w-full items-center justify-between border-b border-white/10 bg-black/40 px-3 sm:px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0052cc] text-white shadow-sm shadow-blue-500/40">
                <Kanban className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white/90 group-hover:text-white">
                Trello
              </span>
            </Link>
          </div>
        </header>

        {/* Board Not Found Fallback Card */}
        <div className="relative z-10 flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/90 p-8 text-center shadow-2xl backdrop-blur-xl animate-in fade-in">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-lg">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">
              Board Not Found
            </h2>
            <p className="text-xs text-white/60 mb-6 leading-relaxed">
              {errorMessage ||
                "This board does not exist, has been deleted, or you don't have permission to access it."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={fetchBoardData}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-semibold text-white transition active:scale-95 cursor-pointer"
              >
                <span>Retry</span>
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0052cc] hover:bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg transition active:scale-95"
              >
                <Layers className="h-4 w-4" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-zinc-950 font-sans text-white select-none">
      {/* Background Layer: Only rendered if explicitly set by user, otherwise pure system default */}
      {boardBg && boardBg !== 'default' && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-300 pointer-events-none"
          style={
            boardBg.startsWith('linear-gradient') || boardBg.startsWith('#')
              ? { background: boardBg }
              : { backgroundImage: `url('${boardBg}')` }
          }
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        </div>
      )}

      {/* Top Navbar */}
      <header className="relative z-30 flex h-12 w-full items-center justify-between border-b border-white/10 bg-black/40 px-3 sm:px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0052cc] text-white shadow-sm shadow-blue-500/40">
              <Kanban className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white/90 group-hover:text-white">
              Trello
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            {/* Workspaces Popover */}
            <div className="relative" ref={workspacesRef}>
              <button
                type="button"
                onClick={() => {
                  setIsWorkspacesOpen((prev) => !prev);
                  setIsRecentOpen(false);
                  setIsStarredOpen(false);
                }}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  isWorkspacesOpen
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{workspaceData?.name || 'Workspaces'}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              <WorkspacesNavPopover
                isOpen={isWorkspacesOpen}
                onClose={() => setIsWorkspacesOpen(false)}
                currentWorkspace={workspaceData}
                onOpenSettings={() => setIsWorkspaceSettingsModalOpen(true)}
                onOpenInvite={() => setIsShareModalOpen(true)}
              />
            </div>

            {/* Recent Boards Popover */}
            <div className="relative" ref={recentRef}>
              <button
                type="button"
                onClick={() => {
                  setIsRecentOpen((prev) => !prev);
                  setIsWorkspacesOpen(false);
                  setIsStarredOpen(false);
                }}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  isRecentOpen
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>Recent</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              <RecentBoardsPopover
                isOpen={isRecentOpen}
                onClose={() => setIsRecentOpen(false)}
                currentBoardId={boardId}
                workspaceName={workspaceData?.name}
              />
            </div>

            {/* Starred Boards Popover */}
            <div className="relative" ref={starredRef}>
              <button
                type="button"
                onClick={() => {
                  setIsStarredOpen((prev) => !prev);
                  setIsWorkspacesOpen(false);
                  setIsRecentOpen(false);
                }}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  isStarredOpen
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>Starred</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              <StarredBoardsPopover
                isOpen={isStarredOpen}
                onClose={() => setIsStarredOpen(false)}
                currentBoardId={boardId}
              />
            </div>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center gap-1 rounded-md bg-[#0052cc] hover:bg-blue-600 active:bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white shadow transition ml-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create</span>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="flex flex-1 max-w-sm mx-4 items-center">
          <button
            type="button"
            onClick={() => setIsGlobalSearchOpen(true)}
            className="relative w-full text-left cursor-pointer group"
          >
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 group-hover:text-white/70 transition" />
            <div className="h-8 w-full rounded-md border border-white/15 bg-white/10 pl-8 pr-12 text-xs text-white/50 backdrop-blur-sm transition group-hover:border-white/30 group-hover:bg-white/15 flex items-center">
              Search...
            </div>
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-white/20 bg-black/40 px-1 py-0.5 text-[9px] font-medium text-white/50 group-hover:text-white/70">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen((prev) => !prev);
                setIsHelpOpen(false);
                setIsProfileOpen(false);
              }}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition cursor-pointer ${
                isNotificationsOpen
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              title="Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
            </button>
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 bg-rose-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white ring-2 ring-zinc-950">
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
              setIsProfileOpen(false);
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition cursor-pointer ${
              isHelpOpen
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title="Help & Shortcuts (?)"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
          <div className="ml-1 flex items-center">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center rounded-full ring-2 ring-white/20 hover:ring-white/40 transition cursor-pointer focus:outline-none"
              aria-label="Toggle user profile menu"
            >
              <div className="h-7 w-7 rounded-full bg-[#0052cc] text-white flex items-center justify-center font-bold text-xs border border-white/20 shadow-sm">
                {currentUser?.full_name
                  ? currentUser.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'U'}
              </div>
            </button>
          </div>
        </div>

        {/* Profile Dropdown Popover */}
        {isProfileOpen && (
          <div
            ref={profileMenuRef}
            className="absolute right-4 top-12 z-50 w-56 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-2xl animate-in fade-in text-white"
          >
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-xs font-semibold text-white">{currentUser?.full_name || 'User'}</p>
              <p className="text-[10px] text-white/50 truncate">{currentUser?.email || ''}</p>
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/5 hover:text-white transition text-left cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile & Visibility</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsProfileModalOpen(true);
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
                onClick={() => {
                  setIsProfileOpen(false);
                  authService.logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Board Sub-Header */}
      <div className="relative z-20 flex h-12 w-full items-center justify-between border-b border-white/10 bg-black/25 px-3 sm:px-4 backdrop-blur-md gap-2">
        {/* Left Options */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {isLoading && !board ? (
            <div className="h-5 w-44 rounded-md bg-white/15 animate-pulse" />
          ) : isEditingBoardTitle ? (
            <input
              type="text"
              value={boardTitleInput}
              onChange={(e) => setBoardTitleInput(e.target.value)}
              onBlur={() => handleRenameBoard(boardTitleInput)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameBoard(boardTitleInput);
                if (e.key === 'Escape') setIsEditingBoardTitle(false);
              }}
              autoFocus
              className="h-7 rounded-md border border-blue-500 bg-zinc-950/80 px-2 text-sm sm:text-base font-bold text-white focus:outline-none"
            />
          ) : (
            <h1
              onClick={() => {
                setIsEditingBoardTitle(true);
                setBoardTitleInput(board?.title || '');
              }}
              className="text-sm sm:text-base font-bold tracking-tight text-white drop-shadow-xs cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded-md transition truncate max-w-[180px] sm:max-w-xs"
              title="Click to rename board"
            >
              {board?.title || 'Board'}
            </h1>
          )}

          {/* Star Button */}
          <button
            type="button"
            onClick={handleToggleBoardStar}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title={boardStarred ? 'Starred' : 'Click to star board'}
          >
            <Star className={`h-4 w-4 ${boardStarred ? 'text-amber-400 fill-current' : ''}`} />
          </button>

          {/* Info Button (About this board) */}
          <button
            type="button"
            onClick={() => openBoardMenu('about')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title="About this board"
          >
            <Info className="h-4 w-4" />
          </button>

          {/* View Switcher Button & Authentic Popover */}
          <div className="relative shrink-0" ref={viewSwitcherRef}>
            <button
              type="button"
              onClick={() => setIsViewSwitcherOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                isViewSwitcherOpen
                  ? 'bg-white/25 text-white shadow'
                  : 'bg-white/10 hover:bg-white/20 text-white/90'
              }`}
              title="Views"
            >
              <Kanban className="h-3.5 w-3.5 text-blue-400" />
              <span className="capitalize hidden sm:inline">{viewMode}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {/* Authentic Trello Views Popover */}
            <BoardViewsPopover
              isOpen={isViewSwitcherOpen}
              onClose={() => setIsViewSwitcherOpen(false)}
              currentView={viewMode}
              onSelectView={(v) => {
                setViewMode(v);
                setIsViewSwitcherOpen(false);
              }}
              isPremium={isWorkspacePremium}
              onUpgradeToPremium={() => {
                setIsWorkspacePremium(true);
                setToastMessage('✨ Workspace upgraded to Trello Premium! All views unlocked.');
              }}
            />
          </div>
        </div>

        {/* Right Options */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isLoading && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-white/10 text-xs text-white/80">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>Syncing...</span>
            </div>
          )}

          {/* Power-Ups */}
          <button
            type="button"
            onClick={() => openBoardMenu('powerups')}
            className="hidden sm:flex items-center gap-1.5 rounded-md hover:bg-white/10 px-2 sm:px-2.5 py-1 text-xs font-medium text-white/80 hover:text-white transition cursor-pointer"
            title="Power-Ups"
          >
            <Puzzle className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden md:inline">Power-Ups</span>
          </button>

          {/* Automation */}
          <button
            type="button"
            onClick={() => openBoardMenu('automation')}
            className="hidden sm:flex items-center gap-1.5 rounded-md hover:bg-white/10 px-2 sm:px-2.5 py-1 text-xs font-medium text-white/80 hover:text-white transition cursor-pointer"
            title="Automation rules"
          >
            <Workflow className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Automation</span>
          </button>

          {/* Filter Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              isFilterOpen || filterKeyword || filterLabelId
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Filter cards"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
            {(filterKeyword || filterLabelId) && (
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <div className="h-4 w-px bg-white/20 mx-0.5 hidden sm:block" />

          {/* Share Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1 rounded-md bg-[#0052cc] hover:bg-blue-600 active:bg-blue-700 px-2.5 sm:px-3 py-1 text-xs font-semibold text-white shadow transition cursor-pointer active:scale-95"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Three Dots Button (Board Menu Drawer) */}
          <button
            type="button"
            onClick={() => openBoardMenu('main')}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer"
            title="Show board menu"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Interactive Card Filter Bar */}
      {isFilterOpen && (
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-900/95 border-b border-white/10 backdrop-blur-md animate-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="Filter by keyword..."
                className="h-8 w-full rounded-lg border border-white/15 bg-white/5 pl-8 pr-7 text-xs text-white placeholder-white/40 focus:border-blue-400 focus:outline-none"
              />
              {filterKeyword && (
                <button
                  type="button"
                  onClick={() => setFilterKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-white/40 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter by label */}
            {allBoardLabels.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-white/50">Labels:</span>
                {allBoardLabels.map((lbl) => {
                  const isSelected = filterLabelId === lbl.id;
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => setFilterLabelId(isSelected ? null : lbl.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-white ' + lbl.colorClass + ' text-white font-bold'
                          : 'opacity-70 hover:opacity-100 ' + lbl.colorClass + ' text-white'
                      }`}
                    >
                      {lbl.label}
                    </button>
                  );
                })}
              </div>
            )}

            {(filterKeyword || filterLabelId) && (
              <button
                type="button"
                onClick={() => {
                  setFilterKeyword('');
                  setFilterLabelId(null);
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2 ml-1 cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(false)}
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close filter bar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div className="relative z-20 flex items-center justify-between px-4 py-2 bg-rose-500/20 border-b border-rose-500/30 text-rose-200 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBoardData}
              className="px-2 py-0.5 rounded bg-rose-500/30 hover:bg-rose-500/40 text-white transition cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-0.5 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Error Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-zinc-900/95 border border-rose-500/40 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/50 hover:text-white transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Board Workspace Body with Authentic Side-by-Side Panels */}
      <div className="relative z-10 flex flex-1 overflow-hidden p-2 gap-2">
        {/* 1. Left Side: Side-by-Side Inbox Panel */}
        {isInboxOpen && (
          <div
            className="relative shrink-0 h-full flex flex-col z-20 animate-in fade-in slide-in-from-left-4"
            style={{ width: inboxWidth }}
          >
            <BoardInboxPanel
              columns={columns}
              onClose={() => setIsInboxOpen(false)}
              onCardClick={handleCardClick}
              onAddCard={(title) => handleQuickAddInbox(title)}
              onToggleCardCompletion={(cardId, completed) => {
                handleUpdateCard(cardId, { completed });
              }}
            />
            {/* Right-edge drag handle — stretch only */}
            <div
              className="absolute top-0 right-0 w-1.5 h-full z-30 flex items-center justify-center group cursor-col-resize select-none"
              onMouseDown={(e) => {
                e.preventDefault();
                isResizingInbox.current = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
              }}
              title="Drag to resize"
            >
              {/* Visual indicator dots */}
              <div className="w-1 h-10 rounded-full bg-white/10 group-hover:bg-[#579dff]/60 transition-colors flex flex-col items-center justify-center gap-1">
                <div className="w-0.5 h-0.5 rounded-full bg-white/40 group-hover:bg-white" />
                <div className="w-0.5 h-0.5 rounded-full bg-white/40 group-hover:bg-white" />
                <div className="w-0.5 h-0.5 rounded-full bg-white/40 group-hover:bg-white" />
              </div>
            </div>
          </div>
        )}

        {/* 2. Middle: Side-by-Side Planner Panel */}
        {isPlannerOpen && (
          <div
            className={`relative h-full flex flex-col z-20 animate-in fade-in slide-in-from-left-4 ${
              isPlannerFitToScreen ? 'flex-1' : 'shrink-0'
            }`}
            style={isPlannerFitToScreen ? undefined : { width: plannerWidth }}
          >
            <BoardPlannerPanel
              columns={columns}
              onClose={() => setIsPlannerOpen(false)}
              onCardClick={handleCardClick}
              onAddCardOnDate={(date, title, listId) => {
                handleAddCardWithDate(listId || columns[0]?.id || '', title, date);
              }}
              onToggleCardCompletion={(cardId, completed) => {
                handleUpdateCard(cardId, { completed });
              }}
              onUpdateCardDueDate={(cardId, dueDate) => {
                handleUpdateCard(cardId, {
                  dueDate,
                  due_date: new Date(dueDate).toISOString(),
                });
              }}
              isFitToScreen={isPlannerFitToScreen}
              onToggleFitToScreen={() => setIsPlannerFitToScreen((prev) => !prev)}
            />
            {/* Right-edge drag handle — stretch only (hidden in fit-to-screen mode) */}
            {!isPlannerFitToScreen && (
              <div
                className="absolute top-0 right-0 w-1.5 h-full z-30 flex items-center justify-center group cursor-col-resize select-none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  isResizingPlanner.current = true;
                  document.body.style.cursor = 'col-resize';
                  document.body.style.userSelect = 'none';
                }}
                title="Drag to resize"
              >
                <div className="w-1 h-10 rounded-full bg-white/10 group-hover:bg-[#579dff]/60 transition-colors flex flex-col items-center justify-center gap-1">
                  <div className="w-0.5 h-0.5 rounded-full bg-white/40 group-hover:bg-white" />
                  <div className="w-0.5 h-0.5 rounded-full bg-white/40 group-hover:bg-white" />
                  <div className="w-0.5 h-0.5 rounded-full bg-white/40 group-hover:bg-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Right: Kanban Board Canvas (Horizontally Scrollable, Always Accessible side-by-side unless Planner fits screen) */}
        {!isPlannerFitToScreen && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <main className="flex-1 overflow-x-auto overflow-y-hidden p-2 pb-20 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-start gap-3 h-full animate-pulse">
                {[1, 2, 3, 4].map((colIndex) => (
                  <div
                    key={colIndex}
                    className="w-72 shrink-0 rounded-xl bg-zinc-900/60 border border-white/10 p-3 flex flex-col gap-3 h-[75vh]"
                  >
                    {/* Skeleton Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="h-4 w-28 rounded bg-white/15" />
                      <div className="h-4 w-6 rounded-full bg-white/10" />
                    </div>

                    {/* Skeleton Gray Pulsing Card Blocks */}
                    <div className="space-y-2.5 flex-1 overflow-hidden">
                      <div className="rounded-lg bg-zinc-800/60 border border-white/5 p-3 space-y-2">
                        <div className="h-3.5 w-3/4 rounded bg-white/15" />
                        <div className="h-2.5 w-1/2 rounded bg-white/10" />
                      </div>
                      <div className="rounded-lg bg-zinc-800/60 border border-white/5 p-3 space-y-2">
                        <div className="h-3.5 w-full rounded bg-white/15" />
                        <div className="h-3.5 w-4/5 rounded bg-white/15" />
                        <div className="flex gap-2 pt-1">
                          <div className="h-2.5 w-12 rounded bg-white/10" />
                          <div className="h-2.5 w-8 rounded bg-white/10" />
                        </div>
                      </div>
                      {colIndex % 2 === 0 && (
                        <div className="rounded-lg bg-zinc-800/60 border border-white/5 p-3 space-y-2">
                          <div className="h-3.5 w-2/3 rounded bg-white/15" />
                          <div className="h-2.5 w-1/3 rounded bg-white/10" />
                        </div>
                      )}
                    </div>

                    {/* Skeleton Add Card Button */}
                    <div className="h-8 rounded-lg bg-white/5 mt-auto" />
                  </div>
                ))}
              </div>
            ) : viewMode !== 'board' ? (
              <BoardViewsCanvas
                viewMode={viewMode}
                columns={filteredColumns}
                onCardClick={handleCardClick}
                onAddCard={(listId, title) => handleAddCardWithDate(listId, title, new Date())}
                onToggleCardCompletion={(cardId, completed) => {
                  handleToggleCardComplete(cardId, !completed);
                }}
                onSwitchToBoard={() => setViewMode('board')}
              />
            ) : (
              <Droppable droppableId="all-lists" direction="horizontal" type="LIST">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex items-start gap-3 h-full"
                  >
                    {filteredColumns.map((column, index) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={provided.draggableProps.style}
                            className={`h-full flex flex-col shrink-0 ${
                              snapshot.isDragging
                                ? 'shadow-2xl opacity-95 z-40'
                                : ''
                            }`}
                          >
                            <section
                              className="flex flex-col max-h-full w-72 shrink-0 rounded-xl bg-zinc-900 border shadow-xl overflow-hidden transition-all duration-200"
                              style={{
                                borderColor: listColors[column.id]
                                  ? `${listColors[column.id]}70`
                                  : 'rgba(255, 255, 255, 0.1)',
                                boxShadow: listColors[column.id]
                                  ? `0 6px 24px ${listColors[column.id]}20`
                                  : undefined,
                              }}
                            >
                              {/* Colored Top Accent Bar */}
                              {listColors[column.id] && (
                                <div
                                  className="h-1 w-full shrink-0"
                                  style={{ backgroundColor: listColors[column.id] }}
                                />
                              )}

                              {/* Column Header with Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 cursor-grab active:cursor-grabbing hover:bg-white/5 transition select-none gap-2"
                                style={
                                  listColors[column.id]
                                    ? {
                                        background: `linear-gradient(180deg, ${listColors[column.id]}18 0%, transparent 100%)`,
                                      }
                                    : undefined
                                }
                              >
                                {editingListId === column.id ? (
                                  <input
                                    type="text"
                                    value={editingListTitle}
                                    onChange={(e) => setEditingListTitle(e.target.value)}
                                    onBlur={() => handleRenameList(column.id, editingListTitle)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleRenameList(column.id, editingListTitle);
                                      }
                                      if (e.key === 'Escape') setEditingListId(null);
                                    }}
                                    autoFocus
                                    className="h-6 w-full rounded border border-blue-500 bg-zinc-950/90 px-1.5 text-xs font-bold uppercase tracking-wider text-white focus:outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    {pinnedListIds.includes(column.id) && (
                                      <span title="Pinned list">
                                        <Pin className="w-3.5 h-3.5 text-blue-400 fill-current shrink-0" />
                                      </span>
                                    )}
                                    {watchedListIds.includes(column.id) && (
                                      <span title="Watching list">
                                        <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      </span>
                                    )}
                                    <h2
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingListId(column.id);
                                        setEditingListTitle(column.title);
                                      }}
                                      className="text-xs font-bold uppercase tracking-wider text-white/90 truncate cursor-pointer hover:bg-white/10 px-1 py-0.5 rounded transition"
                                      title="Click to rename list"
                                    >
                                      {column.title}
                                    </h2>
                                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white/10 px-1 text-[10px] font-semibold text-white/70 shrink-0">
                                      {column.cards.length}
                                    </span>
                                  </div>
                                )}

                                <div className="relative shrink-0" data-list-menu>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (activeListMenuId === column.id) {
                                        setActiveListMenuId(null);
                                        setListMenuAnchor(null);
                                      } else {
                                        setActiveListMenuId(column.id);
                                        setListMenuAnchor(e.currentTarget);
                                      }
                                    }}
                                    className={`flex h-6 w-6 items-center justify-center rounded transition cursor-pointer ${
                                      activeListMenuId === column.id
                                        ? 'bg-white/20 text-white'
                                        : 'hover:bg-white/10 text-white/60 hover:text-white'
                                    }`}
                                    title="List actions"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </button>

                                  <ListActionsMenu
                                    isOpen={activeListMenuId === column.id}
                                    anchorEl={activeListMenuId === column.id ? listMenuAnchor : null}
                                    onClose={() => {
                                      setActiveListMenuId(null);
                                      setListMenuAnchor(null);
                                    }}
                                    column={column}
                                    allColumns={columns}
                                    onAddCard={(colId) => {
                                      setActiveListMenuId(null);
                                      setListMenuAnchor(null);
                                      setAddingCardColumnId(colId);
                                      setNewCardText('');
                                    }}
                                    onCopyList={handleCopyList}
                                    onMoveList={handleMoveListPosition}
                                    onMoveAllCards={handleMoveAllCards}
                                    onSortCards={handleSortCards}
                                    onTogglePinList={handleTogglePinList}
                                    isPinned={pinnedListIds.includes(column.id)}
                                    onToggleWatchList={handleToggleWatchList}
                                    isWatched={watchedListIds.includes(column.id)}
                                    listColor={listColors[column.id] || null}
                                    onChangeListColor={handleChangeListColor}
                                    onArchiveList={handleArchiveList}
                                    onArchiveAllCards={handleArchiveAllCards}
                                  />
                                </div>
                              </div>

                              {/* Cards Droppable Container */}
                              <Droppable droppableId={column.id} type="CARD">
                                {(providedCard, snapshotCard) => (
                                  <div
                                    ref={providedCard.innerRef}
                                    {...providedCard.droppableProps}
                                    className={`flex-1 overflow-y-auto px-2 py-2 space-y-2.5 min-h-[60px] rounded-b-lg ${
                                      snapshotCard.isDraggingOver ? 'bg-white/5' : ''
                                    }`}
                                  >
                                    {column.cards.map((card, cardIndex) => (
                                      <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                                        {(providedDraggableCard, snapshotDraggableCard) => (
                                           <article
                                             ref={providedDraggableCard.innerRef}
                                             {...providedDraggableCard.draggableProps}
                                             {...providedDraggableCard.dragHandleProps}
                                             style={{
                                               ...providedDraggableCard.draggableProps.style,
                                               ...(card.coverColor && !card.coverColor.startsWith('bg-')
                                                 ? { backgroundColor: card.coverColor }
                                                 : {}),
                                             }}
                                             onClick={(e) => {
                                               if (e.defaultPrevented) return;
                                               if (snapshotDraggableCard.isDragging || snapshotDraggableCard.isDropAnimating) return;
                                               handleCardClick(card, column.title);
                                             }}
                                             className={`group relative rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-md cursor-pointer select-none transition-all duration-150 border ${
                                               card.coverColor && card.coverColor.startsWith('bg-')
                                                 ? `${card.coverColor} text-white border-transparent`
                                                 : card.coverColor
                                                 ? 'text-white border-transparent'
                                                 : 'bg-zinc-800/90 hover:bg-zinc-800 border-white/5 text-white/95'
                                             } ${
                                               snapshotDraggableCard.isDragging
                                                 ? 'shadow-2xl ring-2 ring-blue-500/60 opacity-95 bg-zinc-800 cursor-grabbing z-50'
                                                 : 'hover:ring-2 hover:ring-[#579dff] hover:border-transparent'
                                             }`}
                                           >
                                             {/* Cover Image */}
                                             {card.coverImage && (
                                               <div className="-mx-2.5 -mt-2.5 sm:-mx-3 sm:-mt-3 mb-2.5 overflow-hidden rounded-t-xl pointer-events-none">
                                                 <img
                                                   src={card.coverImage}
                                                   alt="Card cover"
                                                   className="h-28 w-full object-cover"
                                                 />
                                               </div>
                                             )}

                                             {/* Tag Chips */}
                                             {card.tags && card.tags.length > 0 && (
                                               <div className="flex flex-wrap gap-1.5 mb-2">
                                                 {card.tags.map((tag) => (
                                                   <span
                                                     key={tag.id}
                                                     className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${tag.colorClass}`}
                                                   >
                                                     {tag.label}
                                                   </span>
                                                 ))}
                                               </div>
                                             )}

                                             {/* Title Row with Hover Circle Checkbox & Pencil Edit Button */}
                                             <div className="flex items-center gap-2 relative">
                                               {/* Circle Checkbox (Authentic Trello hover behavior) */}
                                               <button
                                                 type="button"
                                                 onClick={(e) => {
                                                   e.stopPropagation();
                                                   handleToggleCardComplete(card.id, card.completed);
                                                 }}
                                                 className={`h-4 w-4 shrink-0 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                                                   card.completed
                                                     ? 'border-emerald-400 bg-emerald-500/30 text-emerald-400 opacity-100'
                                                     : 'border-white/80 hover:border-white hover:bg-white/20 opacity-0 group-hover:opacity-100'
                                                 }`}
                                                 title={card.completed ? 'Mark incomplete' : 'Mark complete'}
                                               >
                                                 {card.completed && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                               </button>

                                               {/* Title */}
                                               <h3
                                                 className={`text-xs font-medium leading-snug flex-1 transition-all ${
                                                   card.completed
                                                     ? 'text-white/60 line-through'
                                                     : card.coverColor
                                                     ? 'text-white'
                                                     : 'text-white/95'
                                                 }`}
                                               >
                                                 {card.title}
                                               </h3>

                                               {/* Quick Edit Pencil Icon (Appears on hover) */}
                                               <button
                                                 type="button"
                                                 onClick={(e) => {
                                                   e.stopPropagation();
                                                   handleCardClick(card, column.title);
                                                 }}
                                                 className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center shadow transition-all hover:scale-110 cursor-pointer shrink-0 ml-1"
                                                 title="Edit card"
                                               >
                                                 <Pencil className="h-3 w-3" />
                                               </button>
                                             </div>

                                             {/* Attachment Indicator Pill on Card Preview (if attachments present and not full cover) */}
                                             {(() => {
                                               const attCount = card.attachmentsCount ?? card.attachments?.length ?? 0;
                                               if (attCount <= 0 || card.coverImage) return null;
                                               const firstAtt = card.attachments && card.attachments.length > 0 ? card.attachments[0] : null;
                                               return (
                                                 <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/25 px-2 py-0.5 rounded-md w-fit font-medium">
                                                   <Paperclip className="h-3 w-3 shrink-0 text-cyan-400" />
                                                   <span className="truncate max-w-[170px]">
                                                     {firstAtt?.name || `${attCount} attachment${attCount > 1 ? 's' : ''}`}
                                                   </span>
                                                   {attCount > 1 && (
                                                     <span className="text-[9px] bg-cyan-500/20 px-1 rounded text-cyan-200">
                                                       +{attCount - 1}
                                                     </span>
                                                   )}
                                                 </div>
                                               );
                                             })()}

                                             {/* Metadata Badges */}
                                             {(() => {
                                               const attCount = card.attachmentsCount ?? card.attachments?.length ?? 0;
                                               return (card.dueDate || card.hasDescription || card.checklist || attCount > 0 || (card.commentsCount !== undefined && card.commentsCount > 0) || (card.assignees && card.assignees.length > 0)) && (
                                                 <div
                                                   className={`mt-2.5 flex items-center justify-between border-t ${
                                                     card.coverColor ? 'border-white/20 text-white/80' : 'border-white/5 text-white/50'
                                                   } pt-2 text-[10px]`}
                                                 >
                                                   <div className="flex items-center gap-2.5">
                                                     {card.dueDate && (
                                                       <div className={`flex items-center gap-1 ${card.coverColor ? 'text-white font-medium' : 'text-amber-300'}`}>
                                                         <Clock className="h-3 w-3" />
                                                         <span>{card.dueDate}</span>
                                                       </div>
                                                     )}
                                                     {card.hasDescription && (
                                                       <AlignLeft className={`h-3 w-3 ${card.coverColor ? 'text-white/80' : 'text-white/50'}`} />
                                                     )}
                                                     {card.checklist && (
                                                       <div
                                                         className={`flex items-center gap-1 ${
                                                           card.checklist.current === card.checklist.total ? 'text-emerald-400 font-semibold' : ''
                                                         }`}
                                                       >
                                                         <CheckSquare className="h-3 w-3" />
                                                         <span>
                                                           {card.checklist.current}/{card.checklist.total}
                                                         </span>
                                                       </div>
                                                     )}
                                                     {attCount > 0 && (
                                                       <div
                                                         className={`flex items-center gap-1 font-semibold ${
                                                           card.coverColor ? 'text-white' : 'text-cyan-300'
                                                         }`}
                                                         title={`${attCount} attachment${attCount > 1 ? 's' : ''}`}
                                                       >
                                                         <Paperclip className="h-3 w-3 text-cyan-400" />
                                                         <span>{attCount}</span>
                                                       </div>
                                                     )}
                                                     {card.commentsCount !== undefined && card.commentsCount > 0 && (
                                                       <div className="flex items-center gap-1">
                                                         <MessageSquare className="h-3 w-3" />
                                                         <span>{card.commentsCount}</span>
                                                       </div>
                                                     )}
                                                   </div>

                                                   {/* Assignees Avatars */}
                                                   {card.assignees && card.assignees.length > 0 && (
                                                     <div className="flex items-center -space-x-1">
                                                       {card.assignees.map((assignee, i) => {
                                                         const isUrl =
                                                           assignee.startsWith('http') ||
                                                           assignee.startsWith('/uploads') ||
                                                           assignee.startsWith('data:');
                                                         return isUrl ? (
                                                           <img
                                                             key={i}
                                                             src={assignee}
                                                             alt="Assignee"
                                                             className="h-4 w-4 rounded-full border border-white/20 object-cover"
                                                           />
                                                         ) : (
                                                           <div
                                                             key={i}
                                                             className="h-4 w-4 rounded-full border border-white/20 bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                                                             title={assignee}
                                                           >
                                                             {assignee.slice(0, 2).toUpperCase()}
                                                           </div>
                                                         );
                                                       })}
                                                     </div>
                                                   )}
                                                 </div>
                                               );
                                             })()}
                                           </article>
                                        )}
                                      </Draggable>
                                    ))}
                                    {providedCard.placeholder}
                                  </div>
                                )}
                              </Droppable>

                              {/* Column Footer: Add Card */}
                              <div className="p-2 pt-0 border-t border-white/5 mt-1">
                                {addingCardColumnId === column.id ? (
                                  <div className="space-y-2 mt-2">
                                    <textarea
                                      value={newCardText}
                                      onChange={(e) => setNewCardText(e.target.value)}
                                      placeholder="Enter a title for this card..."
                                      className="w-full resize-none rounded-lg border border-blue-500 bg-zinc-950/80 p-2 text-xs text-white placeholder-white/40 focus:outline-none"
                                      rows={2}
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleAddCardSubmit(column.id);
                                        }
                                      }}
                                    />
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleAddCardSubmit(column.id)}
                                        className="rounded bg-[#0052cc] px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600 transition cursor-pointer"
                                      >
                                        Add Card
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAddingCardColumnId(null);
                                          setNewCardText('');
                                        }}
                                        className="rounded p-1 text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingCardColumnId(column.id);
                                      setNewCardText('');
                                    }}
                                    className="flex w-full items-center gap-1.5 rounded-lg p-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer mt-1"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Add a card</span>
                                  </button>
                                )}
                              </div>
                            </section>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Add Another List Section */}
                    <div className="w-72 shrink-0">
                      {addingList ? (
                        <form
                          onSubmit={handleAddListSubmit}
                          className="rounded-xl bg-zinc-900/90 border border-white/10 p-3 space-y-2 shadow-xl backdrop-blur-md"
                        >
                          <input
                            type="text"
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            placeholder="Enter list title..."
                            autoFocus
                            className="w-full rounded-lg border border-blue-500 bg-zinc-950/80 px-2.5 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="submit"
                              className="rounded bg-[#0052cc] px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600 transition cursor-pointer"
                            >
                              Add List
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingList(false)}
                              className="p-1 text-white/60 hover:text-white transition cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingList(true)}
                          className="flex w-full items-center gap-2 rounded-xl bg-white/15 hover:bg-white/20 backdrop-blur-md border border-white/10 p-3 text-xs font-bold text-white transition cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add another list</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            )}
          </main>
        </DragDropContext>
        )}
      </div>

      {/* Floating Bottom Pill Dock (Original Trello Style) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-1 rounded-full border border-white/15 bg-[#1d2125]/95 p-1.5 shadow-2xl backdrop-blur-xl transition-all duration-200">
          {/* Inbox Tab */}
          <button
            type="button"
            onClick={() => {
              setIsSwitchBoardsOpen(false);
              setIsInboxOpen((prev) => !prev);
            }}
            className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
              isInboxOpen
                ? 'bg-[#579dff]/15 text-[#579dff] font-semibold shadow-sm'
                : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Inbox</span>
            {isInboxOpen && (
              <span className="absolute -bottom-1 left-3.5 right-3.5 h-[2.5px] bg-[#579dff] rounded-full shadow-sm" />
            )}
          </button>

          {/* Planner Tab */}
          <button
            type="button"
            onClick={() => {
              setIsSwitchBoardsOpen(false);
              setIsPlannerOpen((prev) => !prev);
            }}
            className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
              isPlannerOpen
                ? 'bg-[#579dff]/15 text-[#579dff] font-semibold shadow-sm'
                : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Planner</span>
            {isPlannerOpen && (
              <span className="absolute -bottom-1 left-3.5 right-3.5 h-[2.5px] bg-[#579dff] rounded-full shadow-sm" />
            )}
          </button>

          {/* Board Tab */}
          <button
            type="button"
            onClick={() => {
              setIsSwitchBoardsOpen(false);
            }}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
              !isInboxOpen && !isPlannerOpen
                ? 'bg-white text-zinc-950 font-semibold shadow-md'
                : 'text-[#579dff] hover:bg-white/10'
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Board</span>
          </button>

          {/* Vertical Divider */}
          <div className="h-4 w-px bg-white/20 mx-1" />

          {/* Switch Boards Anchor & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSwitchBoardsOpen(!isSwitchBoardsOpen)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                isSwitchBoardsOpen
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Switch boards</span>
            </button>

            {/* Quick Switch Boards Popover */}
            <SwitchBoardsPopover
              isOpen={isSwitchBoardsOpen}
              onClose={() => setIsSwitchBoardsOpen(false)}
              currentBoardId={boardId}
              workspaceId={workspaceData?.id || board?.workspace_id}
              workspaceName={workspaceData?.name || board?.title || 'Workspace'}
              onOpenCreateBoard={() => setIsCreateBoardOpen(true)}
            />
          </div>
        </div>
      </div>



      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          isOpen={Boolean(selectedCard)}
          onClose={() => setSelectedCard(null)}
          cardId={selectedCard.card.id}
          boardId={boardId}
          columnTitle={selectedCard.columnTitle}
          columnId={selectedCard.card.list_id}
          allColumns={columns.map((c) => ({ id: c.id, title: c.title }))}
          initialTitle={selectedCard.card.title}
          initialDescription={selectedCard.card.description}
          initialCompleted={selectedCard.card.completed}
          coverColor={selectedCard.card.coverColor}
          coverImage={selectedCard.card.coverImage}
          dueDate={selectedCard.card.dueDate}
          labels={
            selectedCard.card.tags?.map((t) => ({
              id: t.id,
              name: t.label,
              colorBg: t.colorClass,
              colorBorder: 'border-white/20',
              colorText: 'text-white',
            })) || []
          }
          members={
            selectedCard.card.assignees?.map((a, idx) => ({
              id: `m-${idx}`,
              name: a,
              initials: a.slice(0, 2).toUpperCase(),
            })) || []
          }
          onDeleteCard={handleDeleteCard}
          onMoveCardToList={handleMoveCardToList}
          onArchiveCard={handleArchiveCard}
          onUpdateCard={handleUpdateCard}
        />
      )}

      {/* Profile & Visibility Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      {/* Workspace Settings Modal */}
      <WorkspaceSettingsModal
        isOpen={isWorkspaceSettingsModalOpen}
        onClose={() => setIsWorkspaceSettingsModalOpen(false)}
        workspace={workspaceData}
        onWorkspaceUpdated={(updated) => setWorkspaceData(updated)}
        onWorkspaceDeleted={() => {
          window.location.href = '/dashboard';
        }}
      />

      {/* Slide-In Board Menu Drawer (Three Dots Menu) */}
      <BoardMenuDrawer
        isOpen={isBoardMenuOpen}
        onClose={() => setIsBoardMenuOpen(false)}
        activePanel={boardMenuPanel}
        onPanelChange={(panel) => setBoardMenuPanel(panel)}
        board={board}
        currentUser={currentUser}
        columns={columns}
        currentBg={boardBg}
        onBackgroundChange={handleBackgroundChange}
        isStarred={boardStarred}
        onToggleStar={handleToggleBoardStar}
        isWatching={isWatchingBoard}
        onToggleWatch={() => setIsWatchingBoard((prev) => !prev)}
        onUpdateBoardDescription={handleUpdateBoardDescription}
        onUpdateBoardVisibility={handleUpdateBoardVisibility}
        onCloseBoard={handleCloseBoard}
        onCopyBoard={handleCopyBoard}
        onOpenShareModal={() => {
          setIsBoardMenuOpen(false);
          setIsShareModalOpen(true);
        }}
        onRestoreCard={handleRestoreCard}
        onRestoreList={handleRestoreList}
        onDeleteCardPermanently={handleDeleteCardPermanently}
        onAddSticker={handleAddSticker}
      />

      {/* Share / Invite Members Modal */}
      <InviteMembersModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        workspaceId={workspaceData?.id || board?.workspace_id}
        workspaceName={workspaceData?.name || board?.title || 'Workspace'}
      />

      {/* Create Board Modal (Triggered from Switch Boards Popover) */}
      <CreateBoardModal
        isOpen={isCreateBoardOpen}
        onClose={() => setIsCreateBoardOpen(false)}
        onCreateBoard={handleCreateBoard}
      />

      {/* Global Search Modal (Triggered via Search input or Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        currentBoardId={boardId}
        columns={columns}
        onSelectCard={(card, columnTitle) => {
          setSelectedCard({ card, columnTitle });
        }}
        onSelectList={(listId) => {
          const el = document.getElementById(`column-${listId}`);
          el?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }}
      />

      {/* Help & Shortcuts Modal (Triggered via Help icon or ?) */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};

export default KanbanBoardPage;
