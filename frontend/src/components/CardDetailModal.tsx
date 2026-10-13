import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  AlignLeft,
  CheckSquare,
  Clock,
  Paperclip,
  Tag,
  User,
  Plus,
  Eye,
  Trash2,
  Copy,
  Move,
  Archive,
  Share2,
  Image as ImageIcon,
  Check,
  Search,
  FileText,
  ChevronDown,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Code,
  Quote,
  AtSign,
  MoreHorizontal,
  Sparkles,
  MessageSquare,
  Strikethrough,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { authService, type UserResponse } from '../services/auth';
import { cardService } from '../services/cardService';
import { boardService } from '../services/boardService';
import { getFullFileUrl } from '../services/api';

export interface CardLabel {
  id: string;
  name: string;
  colorBg?: string;
  colorBorder?: string;
  colorText?: string;
  colorDot?: string;
}

export interface CardMember {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  initials?: string;
}

export interface ChecklistItemData {
  id: string;
  text: string;
  is_completed: boolean;
}

export interface ChecklistData {
  id: string;
  title: string;
  items: ChecklistItemData[];
}

export interface CardAttachment {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  url?: string;
  type?: 'image' | 'link' | 'file';
  isCover?: boolean;
}

export interface CardCommentItem {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorInitials?: string;
  content: string;
  createdAt: string;
}

export interface ActivityTimelineItem {
  id: string;
  type: 'comment' | 'activity';
  authorName: string;
  authorInitials: string;
  actionText?: string;
  content?: string;
  createdAt: string;
  timestamp: number;
}

export interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: string;
  boardId?: string;
  columnTitle?: string;
  columnId?: string;
  allColumns?: { id: string; title: string }[];
  initialTitle?: string;
  initialDescription?: string;
  initialCompleted?: boolean;
  dueDate?: string;
  labels?: CardLabel[];
  members?: CardMember[];
  checklists?: ChecklistData[];
  comments?: CardCommentItem[];
  coverImage?: string;
  coverColor?: string;
  attachments?: CardAttachment[];
  initialAttachments?: CardAttachment[];
  onDeleteCard?: (id: string) => void;
  onMoveCardToList?: (cardId: string, targetListId: string) => void;
  onArchiveCard?: (cardId: string) => void;
  onUpdateCard?: (
    id: string,
    updates: {
      title?: string;
      description?: string;
      due_date?: string | null;
      dueDate?: string;
      completed?: boolean;
      is_completed?: boolean;
      tags?: any[];
      assignees?: string[];
      coverImage?: string | null;
      coverColor?: string | null;
      list_id?: string;
      attachmentsCount?: number;
      attachments?: CardAttachment[];
    }
  ) => void;
  onAttachmentsChange?: (attachments: CardAttachment[]) => void;
}

export const LABEL_PALETTE = [
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300', dot: 'bg-emerald-500' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300', dot: 'bg-amber-500' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-300', dot: 'bg-rose-500' },
  { id: 'sky', name: 'Sky', bg: 'bg-sky-500/20', border: 'border-sky-500/40', text: 'text-sky-300', dot: 'bg-sky-500' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-300', dot: 'bg-purple-500' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-300', dot: 'bg-indigo-500' },
];

export const COVER_PALETTE = [
  { id: 'blue', name: 'Classic Blue', bg: 'bg-[#0c66e4]' },
  { id: 'emerald', name: 'Forest Emerald', bg: 'bg-[#1f845a]' },
  { id: 'amber', name: 'Warm Amber', bg: 'bg-[#c25200]' },
  { id: 'crimson', name: 'Crimson Red', bg: 'bg-[#ca3521]' },
  { id: 'purple', name: 'Royal Violet', bg: 'bg-[#6e5dc6]' },
  { id: 'teal', name: 'Teal Cyan', bg: 'bg-[#227d9b]' },
  { id: 'pink', name: 'Vibrant Rose', bg: 'bg-[#ce2775]' },
  { id: 'slate', name: 'Charcoal Slate', bg: 'bg-[#44546f]' },
];

export const getLabelColorClasses = (colorName?: string) => {
  const c = colorName?.toLowerCase() || 'blue';
  switch (c) {
    case 'emerald':
    case 'green':
      return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300', dot: 'bg-emerald-500' };
    case 'amber':
    case 'yellow':
    case 'orange':
      return { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300', dot: 'bg-amber-500' };
    case 'rose':
    case 'red':
      return { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-300', dot: 'bg-rose-500' };
    case 'sky':
    case 'blue':
      return { bg: 'bg-sky-500/20', border: 'border-sky-500/40', text: 'text-sky-300', dot: 'bg-sky-500' };
    case 'purple':
    case 'violet':
      return { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-300', dot: 'bg-purple-500' };
    case 'indigo':
    default:
      return { bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-300', dot: 'bg-indigo-500' };
  }
};

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  isOpen,
  onClose,
  cardId = '',
  boardId,
  columnTitle: columnTitleProp = 'To DO',
  columnId: _columnId,
  allColumns = [],
  initialTitle = '',
  initialDescription = '',
  initialCompleted = false,
  dueDate: dueDateProp,
  labels: labelsProp = [],
  members: membersProp = [],
  checklists: checklistsProp = [],
  comments: commentsProp = [],
  coverImage: coverImageProp,
  coverColor: coverColorProp,
  attachments: attachmentsProp = [],
  initialAttachments = [],
  onDeleteCard,
  onMoveCardToList,
  onArchiveCard,
  onUpdateCard,
  onAttachmentsChange,
}) => {
  if (!isOpen) return null;

  // Title, List Title & Completion State
  const [title, setTitle] = useState(initialTitle || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentColumnTitle, setCurrentColumnTitle] = useState(columnTitleProp);
  const [isCompleted, setIsCompleted] = useState(Boolean(initialCompleted));
  const [isWatching, setIsWatching] = useState(false);

  // Description & Editor Toolbar
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(initialDescription || '');
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Cover
  const [coverColor, setCoverColor] = useState<string | null>(coverColorProp || null);
  const [coverImage, setCoverImage] = useState<string | null>(coverImageProp || null);

  useEffect(() => {
    setCoverColor(coverColorProp || null);
  }, [coverColorProp]);

  useEffect(() => {
    setCoverImage(coverImageProp || null);
  }, [coverImageProp]);

  useEffect(() => {
    setIsCompleted(Boolean(initialCompleted));
  }, [initialCompleted]);

  useEffect(() => {
    setTitle(initialTitle || '');
  }, [initialTitle]);

  useEffect(() => {
    setDescription(initialDescription || '');
  }, [initialDescription]);

  useEffect(() => {
    setCurrentColumnTitle(columnTitleProp);
  }, [columnTitleProp]);

  // Labels
  const [labels, setLabels] = useState<CardLabel[]>(labelsProp || []);
  const [availableBoardLabels, setAvailableBoardLabels] = useState<CardLabel[]>([
    { id: 'def-1', name: 'High Priority', ...getLabelColorClasses('rose') },
    { id: 'def-2', name: 'Feature', ...getLabelColorClasses('emerald') },
    { id: 'def-3', name: 'Bug', ...getLabelColorClasses('amber') },
    { id: 'def-4', name: 'Documentation', ...getLabelColorClasses('sky') },
    { id: 'def-5', name: 'UI / Design', ...getLabelColorClasses('purple') },
  ]);
  const [labelSearch, setLabelSearch] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedPaletteColor, setSelectedPaletteColor] = useState(LABEL_PALETTE[0]);

  // Members
  const [members, setMembers] = useState<CardMember[]>(membersProp || []);
  const [availableBoardMembers, setAvailableBoardMembers] = useState<CardMember[]>([]);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    if (labelsProp && labelsProp.length > 0) {
      setLabels(labelsProp);
    }
  }, [labelsProp]);

  useEffect(() => {
    if (membersProp && membersProp.length > 0) {
      setMembers(membersProp);
    }
  }, [membersProp]);

  // Dates
  const [dueDate, setDueDate] = useState<string | undefined>(dueDateProp);
  const [dueDateInput, setDueDateInput] = useState<string>('');

  // Checklists
  const [checklists, setChecklists] = useState<ChecklistData[]>(checklistsProp || []);
  const [newChecklistTitle, setNewChecklistTitle] = useState('Checklist');
  const [addingItemForClId, setAddingItemForClId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState<CardAttachment[]>(() => {
    if (initialAttachments && initialAttachments.length > 0) return initialAttachments;
    if (attachmentsProp && attachmentsProp.length > 0) return attachmentsProp;
    if (cardId) {
      try {
        const saved = localStorage.getItem('trello_card_attachments_' + cardId);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Comments & Timeline Activities
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  const [timelineItems, setTimelineItems] = useState<ActivityTimelineItem[]>(() => {
    if (commentsProp && commentsProp.length > 0) {
      return commentsProp.map((c) => ({
        id: c.id,
        type: 'comment',
        authorName: c.authorName,
        authorInitials: c.authorInitials || c.authorName.slice(0, 2).toUpperCase(),
        content: c.content,
        createdAt: c.createdAt,
        timestamp: Date.now(),
      }));
    }
    return [];
  });

  // Popovers: 'add' | 'labels' | 'members' | 'dates' | 'checklist' | 'cover' | 'list-select' | 'card-menu' | null
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const userFullName = currentUser?.full_name || 'Current User';
  const userInitials = (currentUser?.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Load User, Board Labels, Members, Comments, Activities
  useEffect(() => {
    authService.getMe().then((u) => setCurrentUser(u)).catch(() => null);

    if (boardId) {
      boardService.getBoardMembers(boardId).then((bmList) => {
        if (bmList && bmList.length > 0) {
          setAvailableBoardMembers(
            bmList.map((bm: any) => ({
              id: bm.user_id || bm.user?.id || bm.id,
              name: bm.user?.full_name || 'Member',
              email: bm.user?.email,
              avatarUrl: bm.user?.avatar_url,
              avatar: bm.user?.avatar_url,
              initials: (bm.user?.full_name || 'M').slice(0, 2).toUpperCase(),
            }))
          );
        }
      }).catch(() => null);

      cardService.getBoardLabels(boardId).then((lbls) => {
        if (lbls && lbls.length > 0) {
          setAvailableBoardLabels(
            lbls.map((l) => ({
              id: l.id,
              name: l.name,
              ...getLabelColorClasses(l.color),
            }))
          );
        }
      }).catch(() => null);
    }

    if (cardId && !cardId.startsWith('card-')) {
      cardService.getCardLabels(cardId).then((lbls) => {
        if (lbls && lbls.length > 0) {
          setLabels(
            lbls.map((l) => ({
              id: l.id,
              name: l.name,
              ...getLabelColorClasses(l.color),
            }))
          );
        }
      }).catch(() => null);

      cardService.getCardMembers(cardId).then((mems) => {
        if (mems && mems.length > 0) {
          setMembers(
            mems.map((m) => ({
              id: m.user_id,
              name: m.user?.full_name || 'Member',
              email: m.user?.email,
              avatarUrl: m.user?.avatar_url,
              avatar: m.user?.avatar_url,
              initials: (m.user?.full_name || 'M').slice(0, 2).toUpperCase(),
            }))
          );
        }
      }).catch(() => null);
      cardService.getCardComments(cardId).then((comms) => {
        if (comms && comms.length > 0) {
          const loaded: ActivityTimelineItem[] = comms.map((c) => ({
            id: c.id,
            type: 'comment',
            authorName: c.user?.full_name || 'User',
            authorInitials: (c.user?.full_name || 'U').slice(0, 2).toUpperCase(),
            content: c.content,
            createdAt: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(c.created_at).getTime(),
          }));
          setTimelineItems((prev) => [...loaded, ...prev.filter((p) => p.type !== 'comment')]);
        }
      }).catch(() => null);

      cardService.getCardActivity(cardId).then((acts) => {
        if (acts && acts.length > 0) {
          const loadedActs: ActivityTimelineItem[] = acts.map((a) => {
            let actionDescription = a.action_type.toLowerCase().replace(/_/g, ' ');
            if (a.action_type === 'COMPLETE_CARD') actionDescription = 'marked this card as complete';
            if (a.action_type === 'INCOMPLETE_CARD') actionDescription = 'marked this card as incomplete';
            if (a.action_type === 'CREATE_COMMENT') actionDescription = 'commented on this card';
            if (a.action_type === 'MOVE_CARD') actionDescription = 'moved this card';
            return {
              id: a.id,
              type: 'activity',
              authorName: a.user?.full_name || 'User',
              authorInitials: (a.user?.full_name || 'U').slice(0, 2).toUpperCase(),
              actionText: actionDescription,
              createdAt: new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
              timestamp: new Date(a.created_at).getTime(),
            };
          });
          setTimelineItems((prev) => [...prev.filter((p) => p.type !== 'activity'), ...loadedActs]);
        }
      }).catch(() => null);

      cardService.getCardChecklists(cardId).then((cls) => {
        if (cls && cls.length > 0) {
          setChecklists(
            cls.map((c) => ({
              id: c.id,
              title: c.title,
              items: (c.items || []).map((it) => ({
                id: it.id,
                text: it.content,
                is_completed: Boolean(it.is_completed),
              })),
            }))
          );
        }
      }).catch(() => null);

      cardService.getCardAttachments(cardId).then((atts) => {
        if (atts && atts.length > 0) {
          const mapped: CardAttachment[] = atts.map((a) => {
            const isImg =
              a.content_type?.startsWith('image/') ||
              /\.(png|jpe?g|gif|webp|svg)$/i.test(a.file_name);
            // Normalize relative backend paths to full URLs
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
          });
          setAttachments(mapped);
          try {
            localStorage.setItem('trello_card_attachments_' + cardId, JSON.stringify(mapped));
          } catch {}
          if (onUpdateCard) {
            onUpdateCard(cardId, { attachmentsCount: mapped.length, attachments: mapped });
          }
        }
      }).catch(() => null);
    }
  }, [cardId, boardId]);

  // Click outside and escape listeners for popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePopover) {
          setActivePopover(null);
        } else {
          onClose();
        }
      }
    };
    if (activePopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePopover, onClose]);

  // Helper to append timeline activity
  const logActivity = (actionText: string) => {
    const newItem: ActivityTimelineItem = {
      id: `act-${Date.now()}`,
      type: 'activity',
      authorName: userFullName,
      authorInitials: userInitials,
      actionText,
      createdAt: 'Just now',
      timestamp: Date.now(),
    };
    setTimelineItems((prev) => [newItem, ...prev]);
  };

  // Toggle Card Completion
  const handleToggleCardCompletion = async () => {
    const next = !isCompleted;
    setIsCompleted(next);
    logActivity(next ? 'marked this card as complete' : 'marked this card as incomplete');
    if (onUpdateCard && cardId) {
      onUpdateCard(cardId, { completed: next, is_completed: next });
    }
    if (cardId && !cardId.startsWith('card-')) {
      try {
        await cardService.updateCard(cardId, { is_completed: next } as any);
      } catch (err) {
        console.warn('Failed to sync completion:', err);
      }
    }
    showToast(next ? 'Card marked complete' : 'Card marked incomplete');
  };

  // Title Save
  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (!title.trim()) {
      setTitle(initialTitle || 'Untitled Card');
      return;
    }
    if (onUpdateCard && cardId) {
      onUpdateCard(cardId, { title: title.trim() });
    }
    if (cardId && !cardId.startsWith('card-')) {
      cardService.updateCard(cardId, { title: title.trim() }).catch(() => null);
    }
  };

  // Description Save
  const handleSaveDescription = () => {
    setIsEditingDesc(false);
    if (onUpdateCard && cardId) {
      onUpdateCard(cardId, { description });
    }
    if (cardId && !cardId.startsWith('card-')) {
      cardService.updateCard(cardId, { description }).catch(() => null);
    }
    showToast('Description updated');
  };

  // Markdown Toolbar helper
  const insertFormatting = (prefix: string, suffix = '', defaultText = '') => {
    const el = descTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.slice(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;
    const newText = text.slice(0, start) + replacement + text.slice(end);
    setDescription(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  // Comments
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const content = newComment.trim();
    const commentId = `comm-${Date.now()}`;
    const item: ActivityTimelineItem = {
      id: commentId,
      type: 'comment',
      authorName: userFullName,
      authorInitials: userInitials,
      content,
      createdAt: 'Just now',
      timestamp: Date.now(),
    };
    setTimelineItems((prev) => [item, ...prev]);
    setNewComment('');
    setIsCommentFocused(false);

    if (cardId && !cardId.startsWith('card-')) {
      try {
        await cardService.createCardComment(cardId, content);
      } catch (err) {
        console.warn('Backend comment failed:', err);
      }
    }
    showToast('Comment saved');
  };

  const handleDeleteComment = (commentId: string) => {
    setTimelineItems((prev) => prev.filter((it) => it.id !== commentId));
    if (!commentId.startsWith('comm-')) {
      cardService.deleteCardComment(commentId).catch(() => null);
    }
  };

  // Checklists
  const handleAddChecklist = async () => {
    const titleText = newChecklistTitle.trim() || 'Checklist';
    let checklistId = `cl-${Date.now()}`;
    if (cardId && !cardId.startsWith('card-')) {
      try {
        const res = await cardService.createCardChecklist(cardId, titleText);
        if (res?.id) checklistId = res.id;
      } catch (err) {
        console.warn('Backend checklist failed:', err);
      }
    }
    const newCl: ChecklistData = {
      id: checklistId,
      title: titleText,
      items: [],
    };
    setChecklists((prev) => [...prev, newCl]);
    setNewChecklistTitle('Checklist');
    setActivePopover(null);
    logActivity(`added checklist "${titleText}" to this card`);
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    const cl = checklists.find((c) => c.id === checklistId);
    setChecklists((prev) => prev.filter((c) => c.id !== checklistId));
    if (!checklistId.startsWith('cl-')) {
      cardService.deleteChecklist(checklistId).catch(() => null);
    }
    if (cl) logActivity(`removed checklist "${cl.title}"`);
  };

  const handleAddItem = async (checklistId: string) => {
    if (!newItemText.trim()) return;
    const content = newItemText.trim();
    let itemId = `cli-${Date.now()}`;
    if (!checklistId.startsWith('cl-')) {
      try {
        const res = await cardService.createChecklistItem(checklistId, content);
        if (res?.id) itemId = res.id;
      } catch (err) {
        console.warn('Backend item failed:', err);
      }
    }
    setChecklists((prev) =>
      prev.map((cl) => (cl.id === checklistId ? { ...cl, items: [...cl.items, { id: itemId, text: content, is_completed: false }] } : cl))
    );
    setNewItemText('');
  };

  const handleToggleChecklistItem = async (checklistId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((cl) => {
        if (cl.id !== checklistId) return cl;
        return {
          ...cl,
          items: cl.items.map((it) => {
            if (it.id !== itemId) return it;
            const nextStatus = !it.is_completed;
            if (!itemId.startsWith('cli-')) {
              cardService.updateChecklistItem(itemId, { is_completed: nextStatus }).catch(() => null);
            }
            if (nextStatus) {
              logActivity(`completed "${it.text}"`);
            }
            return { ...it, is_completed: nextStatus };
          }),
        };
      })
    );
  };

  const handleDeleteChecklistItem = async (checklistId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((cl) => (cl.id === checklistId ? { ...cl, items: cl.items.filter((it) => it.id !== itemId) } : cl))
    );
    if (!itemId.startsWith('cli-')) {
      cardService.deleteChecklistItem(itemId).catch(() => null);
    }
  };

  // Labels Toggle
  const handleToggleLabel = async (label: CardLabel) => {
    const exists = labels.some((l) => l.id === label.id);
    let nextLabels: CardLabel[];
    if (exists) {
      nextLabels = labels.filter((l) => l.id !== label.id);
      setLabels(nextLabels);
      if (cardId && !cardId.startsWith('card-') && !label.id.startsWith('lbl-') && !label.id.startsWith('def-')) {
        cardService.detachCardLabel(cardId, label.id).catch(() => null);
      }
    } else {
      let activeLabel = label;
      if (cardId && !cardId.startsWith('card-')) {
        let labelIdToAttach = label.id;
        if (label.id.startsWith('def-') && boardId) {
          try {
            const colorName =
              label.id === 'def-1'
                ? 'rose'
                : label.id === 'def-2'
                ? 'emerald'
                : label.id === 'def-3'
                ? 'amber'
                : label.id === 'def-4'
                ? 'sky'
                : 'purple';
            const created = await cardService.createBoardLabel(boardId, {
              name: label.name,
              color: colorName,
            });
            if (created?.id) {
              labelIdToAttach = created.id;
              activeLabel = { ...label, id: created.id };
              setAvailableBoardLabels((prev) =>
                prev.map((pl) => (pl.id === label.id ? activeLabel : pl))
              );
            }
          } catch (err) {
            console.warn('Failed creating default label:', err);
          }
        }
        if (!labelIdToAttach.startsWith('lbl-') && !labelIdToAttach.startsWith('def-')) {
          cardService.attachCardLabel(cardId, labelIdToAttach).catch(() => null);
        }
      }
      nextLabels = [...labels, activeLabel];
      setLabels(nextLabels);
    }
    if (onUpdateCard && cardId) {
      onUpdateCard(cardId, {
        tags: nextLabels.map((l) => ({
          id: l.id,
          label: l.name,
          colorClass: `${l.colorBg} ${l.colorText} ${l.colorBorder}`,
        })),
      });
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    const name = newLabelName.trim();
    let labelId = `lbl-${Date.now()}`;
    if (boardId) {
      try {
        const res = await cardService.createBoardLabel(boardId, {
          name,
          color: selectedPaletteColor.name.toLowerCase(),
        });
        if (res?.id) labelId = res.id;
      } catch (err) {
        console.warn('Backend label creation failed:', err);
      }
    }
    const newLbl: CardLabel = {
      id: labelId,
      name,
      colorBg: selectedPaletteColor.bg,
      colorBorder: selectedPaletteColor.border,
      colorText: selectedPaletteColor.text,
      colorDot: selectedPaletteColor.dot,
    };
    setAvailableBoardLabels((prev) => [...prev, newLbl]);
    const nextLabels = [...labels, newLbl];
    setLabels(nextLabels);
    if (cardId && !cardId.startsWith('card-') && !labelId.startsWith('lbl-')) {
      cardService.attachCardLabel(cardId, labelId).catch(() => null);
    }
    if (onUpdateCard && cardId) {
      onUpdateCard(cardId, {
        tags: nextLabels.map((l) => ({
          id: l.id,
          label: l.name,
          colorClass: `${l.colorBg} ${l.colorText} ${l.colorBorder}`,
        })),
      });
    }
    setNewLabelName('');
  };

  // Members Toggle
  const handleToggleMember = async (m: CardMember) => {
    const isAssigned = members.some((mem) => mem.id === m.id);
    let nextMembers: CardMember[];
    if (isAssigned) {
      nextMembers = members.filter((mem) => mem.id !== m.id);
      setMembers(nextMembers);
      if (cardId && !cardId.startsWith('card-')) {
        cardService.removeCardMember(cardId, m.id).catch(() => null);
      }
    } else {
      nextMembers = [...members, m];
      setMembers(nextMembers);
      if (cardId && !cardId.startsWith('card-')) {
        cardService.assignCardMember(cardId, m.id).catch(() => null);
      }
    }
    if (onUpdateCard && cardId) {
      onUpdateCard(cardId, {
        assignees: nextMembers.map((mem) => mem.avatar || mem.avatarUrl || mem.name),
      });
    }
  };

  // Move to list
  const handleSelectTargetList = (targetCol: { id: string; title: string }) => {
    setCurrentColumnTitle(targetCol.title);
    setActivePopover(null);
    if (onMoveCardToList && cardId) {
      onMoveCardToList(cardId, targetCol.id);
    }
    logActivity(`moved this card from "${currentColumnTitle}" to "${targetCol.title}"`);
    showToast(`Moved to ${targetCol.title}`);
  };

  // Helper: normalize backend-relative URLs to full absolute URLs
  const normalizeFileUrl = (url: string): string => {
    return getFullFileUrl(url);
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    let attId = `att-${Date.now()}`;
    // Start with a blob URL as immediate preview; will be replaced with backend URL
    let fileUrl = URL.createObjectURL(file);
    const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);

    if (cardId && !cardId.startsWith('card-')) {
      try {
        const res = await cardService.uploadCardAttachment(cardId, file);
        if (res?.id) {
          attId = res.id;
          // Normalize to full URL so images actually load
          fileUrl = normalizeFileUrl(res.file_url);
        }
      } catch (err) {
        console.warn('Backend file upload failed, falling back to local object URL:', err);
      }
    }

    const newAtt: CardAttachment = {
      id: attId,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: 'Just now',
      url: fileUrl,
      type: isImg ? 'image' : 'file',
    };

    const updated = [newAtt, ...attachments];
    setAttachments(updated);
    if (cardId) {
      try {
        localStorage.setItem('trello_card_attachments_' + cardId, JSON.stringify(updated));
      } catch {}
    }

    // Authentic Quasha behavior: If it is an image and card has no cover, set as cover!
    let newCoverImage = coverImage;
    if (isImg && !coverImage && !coverColor) {
      newCoverImage = fileUrl;
      setCoverImage(fileUrl);
      if (cardId && !cardId.startsWith('card-')) {
        cardService.updateCard(cardId, { cover_image: fileUrl, cover_color: undefined }).catch(() => null);
      }
    }

    if (onUpdateCard && cardId) {
      onUpdateCard(cardId, {
        attachmentsCount: updated.length,
        attachments: updated,
        ...(newCoverImage ? { coverImage: newCoverImage } : {}),
      });
    }
    if (onAttachmentsChange) onAttachmentsChange(updated);

    logActivity(`attached "${file.name}" to this card`);
    showToast(`Attached "${file.name}"`);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActivePopover(null);
  };

  // Link Attachment
  const handleAttachLink = async () => {
    if (!linkUrl.trim()) return;
    const cleanUrl = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    const name = linkText.trim() || cleanUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    let attId = `att-${Date.now()}`;

    if (cardId && !cardId.startsWith('card-')) {
      try {
        const res = await cardService.createCardAttachment(cardId, {
          file_name: name,
          file_url: cleanUrl,
          file_size: 1024,
          content_type: 'text/html',
        });
        if (res?.id) {
          attId = res.id;
        }
      } catch (err) {
        console.warn('Backend link attachment failed, falling back to local:', err);
      }
    }

    const newAtt: CardAttachment = {
      id: attId,
      name,
      size: 'Link',
      uploadedAt: 'Just now',
      url: cleanUrl,
      type: 'link',
    };

    const updated = [newAtt, ...attachments];
    setAttachments(updated);
    if (cardId) {
      try {
        localStorage.setItem('trello_card_attachments_' + cardId, JSON.stringify(updated));
      } catch {}
    }

    if (onUpdateCard && cardId) {
      onUpdateCard(cardId, {
        attachmentsCount: updated.length,
        attachments: updated,
      });
    }
    if (onAttachmentsChange) onAttachmentsChange(updated);

    logActivity(`attached link "${name}" to this card`);
    showToast(`Attached link "${name}"`);
    setLinkUrl('');
    setLinkText('');
    setActivePopover(null);
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    const target = attachments.find((a) => a.id === attachmentId);
    const updated = attachments.filter((a) => a.id !== attachmentId);
    setAttachments(updated);
    if (cardId) {
      try {
        localStorage.setItem('trello_card_attachments_' + cardId, JSON.stringify(updated));
      } catch {}
    }

    let clearCover = false;
    if (target && target.url && target.url === coverImage) {
      clearCover = true;
      setCoverImage(null);
      if (cardId && !cardId.startsWith('card-')) {
        cardService.updateCard(cardId, { cover_image: null }).catch(() => null);
      }
    }

    if (onUpdateCard && cardId) {
      onUpdateCard(cardId, {
        attachmentsCount: updated.length,
        attachments: updated,
        ...(clearCover ? { coverImage: null } : {}),
      });
    }
    if (onAttachmentsChange) onAttachmentsChange(updated);

    if (!attachmentId.startsWith('att-')) {
      cardService.deleteCardAttachment(attachmentId).catch(() => null);
    }
    showToast('Attachment deleted');
  };

  const handleToggleAttachmentCover = (att: CardAttachment) => {
    if (!att.url) return;
    const isCurrentCover = coverImage === att.url;
    if (isCurrentCover) {
      setCoverImage(null);
      if (onUpdateCard && cardId) {
        onUpdateCard(cardId, { coverImage: null });
      }
      if (cardId && !cardId.startsWith('card-')) {
        cardService.updateCard(cardId, { cover_image: null }).catch(() => null);
      }
      showToast('Cover removed');
    } else {
      setCoverImage(att.url);
      setCoverColor(null);
      if (onUpdateCard && cardId) {
        onUpdateCard(cardId, { coverImage: att.url, coverColor: null });
      }
      if (cardId && !cardId.startsWith('card-')) {
        cardService.updateCard(cardId, { cover_image: att.url, cover_color: undefined }).catch(() => null);
      }
      showToast('Made attachment card cover');
    }
  };

  // Render Popover Box
  const renderPopoverBox = (align?: 'left' | 'right') => {
    if (!activePopover) return null;

    const isRight =
      align === 'right' || activePopover === 'card-menu' || activePopover === 'cover';

    return (
      <div
        ref={popoverRef}
        className={`absolute z-[200] w-72 max-w-[calc(100vw-32px)] max-h-[calc(85vh-80px)] overflow-y-auto custom-scrollbar rounded-xl border border-[#384148] bg-[#22272b] p-3 text-xs text-[#b6c2cf] shadow-2xl animate-in fade-in zoom-in-95 select-none ${
          isRight ? 'right-0' : 'left-0'
        }`}
        style={{
          top: '100%',
          marginTop: '6px',
          ...(isRight ? { right: 0, left: 'auto' } : { left: 0, right: 'auto' }),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* POPOVER: ADD ANY */}
        {activePopover === 'add' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between pb-2 border-b border-[#384148]">
              <span className="font-semibold text-xs text-[#9fadbc]">Add to card</span>
              <button onClick={() => setActivePopover(null)} className="text-[#9fadbc] hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => setActivePopover('labels')}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Labels</span>
            </button>
            <button
              onClick={() => setActivePopover('dates')}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Dates</span>
            </button>
            <button
              onClick={() => setActivePopover('checklist')}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Checklist</span>
            </button>
            <button
              onClick={() => setActivePopover('members')}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span>Members</span>
            </button>
            <button
              onClick={() => setActivePopover('attachment')}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
              <span>Attachment</span>
            </button>
            <button
              onClick={() => setActivePopover('cover')}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>Cover</span>
            </button>
          </div>
        )}

        {/* POPOVER: ATTACHMENT */}
        {activePopover === 'attachment' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#384148]">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-[#9fadbc]">
                <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                <span>Attach</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePopover(null)}
                className="text-[#9fadbc] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Option 1: File from Computer */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white/80 block">
                Attach a file from your computer
              </label>
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#2c333a] hover:bg-[#323940] border border-[#384148] text-white text-xs font-semibold transition cursor-pointer shadow-sm hover:border-[#579dff]"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Choose a file</span>
              </button>
              <p className="text-[10px] text-[#9fadbc]">Supports images, docs, PDFs, spreadsheets, code</p>
            </div>

            {/* Option 2: Attach a link */}
            <div className="border-t border-[#384148] pt-2 space-y-2">
              <label className="text-[11px] font-semibold text-white/80 block">Attach a link</label>
              <input
                type="text"
                placeholder="Paste any link here (e.g. https://...)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAttachLink()}
                className="w-full rounded bg-[#1d2125] border border-[#738496] px-2.5 py-1.5 text-xs text-white placeholder-[#9fadbc] focus:outline-none focus:border-[#579dff]"
              />
              {linkUrl.trim() && (
                <input
                  type="text"
                  placeholder="Display text (optional)"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAttachLink()}
                  className="w-full rounded bg-[#1d2125] border border-[#738496] px-2.5 py-1.5 text-xs text-white placeholder-[#9fadbc] focus:outline-none focus:border-[#579dff]"
                />
              )}
              <button
                type="button"
                onClick={handleAttachLink}
                disabled={!linkUrl.trim()}
                className="w-full py-1.5 rounded bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-40 text-white text-xs font-semibold transition cursor-pointer"
              >
                Attach
              </button>
            </div>
          </div>
        )}

        {/* POPOVER: LABELS */}
        {activePopover === 'labels' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#384148]">
              <span className="font-semibold text-xs text-[#9fadbc]">Labels</span>
              <button onClick={() => setActivePopover(null)} className="text-[#9fadbc] hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                placeholder="Search labels..."
                value={labelSearch}
                onChange={(e) => setLabelSearch(e.target.value)}
                className="w-full rounded bg-[#1d2125] border border-[#738496] py-1 pl-8 pr-2.5 text-xs text-white focus:outline-none focus:border-[#579dff]"
              />
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {availableBoardLabels
                .filter((l) => l.name.toLowerCase().includes(labelSearch.toLowerCase()))
                .map((l) => {
                  const isAttached = labels.some((att) => att.id === l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleToggleLabel(l)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-semibold border transition cursor-pointer ${
                        l.colorBg || 'bg-blue-500/20'
                      } ${l.colorBorder || 'border-blue-500/40'} ${l.colorText || 'text-blue-300'}`}
                    >
                      <span>{l.name}</span>
                      {isAttached && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  );
                })}
            </div>
            <div className="border-t border-[#384148] pt-2 space-y-2">
              <input
                type="text"
                placeholder="Create label name..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="w-full rounded bg-[#1d2125] border border-[#738496] px-2.5 py-1 text-xs text-white focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                {LABEL_PALETTE.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedPaletteColor(color)}
                    className={`h-5 w-5 rounded ${color.dot} flex items-center justify-center cursor-pointer ${
                      selectedPaletteColor.id === color.id ? 'ring-2 ring-white scale-110' : 'opacity-70'
                    }`}
                  >
                    {selectedPaletteColor.id === color.id && <Check className="h-3 w-3 text-white" />}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleCreateLabel}
                disabled={!newLabelName.trim()}
                className="w-full py-1.5 rounded bg-[#579dff] hover:bg-[#85b8ff] disabled:opacity-40 text-xs font-semibold text-[#1d2125] transition cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* POPOVER: DATES */}
        {activePopover === 'dates' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#384148]">
              <span className="font-semibold text-xs text-[#9fadbc]">Due date</span>
              <button onClick={() => setActivePopover(null)} className="text-[#9fadbc] hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <input
                type="datetime-local"
                value={dueDateInput}
                onChange={(e) => setDueDateInput(e.target.value)}
                className="w-full rounded bg-[#1d2125] border border-[#738496] px-2 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!dueDateInput) return;
                  const formatted = new Date(dueDateInput).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  setDueDate(formatted);
                  if (onUpdateCard && cardId) {
                    onUpdateCard(cardId, { due_date: dueDateInput, dueDate: formatted });
                  }
                  logActivity(`set due date to ${formatted}`);
                  setActivePopover(null);
                  showToast('Due date updated');
                }}
                className="flex-1 py-1.5 rounded bg-[#579dff] hover:bg-[#85b8ff] text-xs font-semibold text-[#1d2125] transition cursor-pointer"
              >
                Save
              </button>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => {
                    setDueDate(undefined);
                    setDueDateInput('');
                    if (onUpdateCard && cardId) {
                      onUpdateCard(cardId, { due_date: null, dueDate: undefined });
                    }
                    logActivity('removed the due date');
                    setActivePopover(null);
                  }}
                  className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/15 text-xs text-white/70 transition cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )}

        {/* POPOVER: CHECKLIST */}
        {activePopover === 'checklist' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#384148]">
              <span className="font-semibold text-xs text-[#9fadbc]">Add checklist</span>
              <button onClick={() => setActivePopover(null)} className="text-[#9fadbc] hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#9fadbc] block mb-1">Title</label>
              <input
                type="text"
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                autoFocus
                className="w-full rounded bg-[#1d2125] border border-[#738496] px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddChecklist}
              className="w-full py-1.5 rounded bg-[#579dff] hover:bg-[#85b8ff] text-xs font-semibold text-[#1d2125] transition cursor-pointer"
            >
              Add
            </button>
          </div>
        )}

        {/* POPOVER: MEMBERS */}
        {activePopover === 'members' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#384148]">
              <span className="font-semibold text-xs text-[#9fadbc]">Members</span>
              <button onClick={() => setActivePopover(null)} className="text-[#9fadbc] hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                placeholder="Search members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full rounded bg-[#1d2125] border border-[#738496] py-1 pl-8 pr-2.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              {[
                ...(currentUser
                  ? [
                      {
                        id: currentUser.id,
                        name: currentUser.full_name,
                        email: currentUser.email,
                        avatarUrl: currentUser.avatar_url,
                        avatar: currentUser.avatar_url,
                        initials: userInitials,
                      },
                    ]
                  : []),
                ...availableBoardMembers,
              ]
                .filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx)
                .filter((m) => m.name.toLowerCase().includes(memberSearch.toLowerCase()))
                .map((m) => {
                  const isAssigned = members.some((mem) => mem.id === m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleToggleMember(m)}
                      className={`w-full flex items-center justify-between p-2 rounded text-xs transition cursor-pointer text-left ${
                        isAssigned ? 'bg-[#579dff]/20 text-white' : 'hover:bg-[#a6c5e214] text-[#b6c2cf]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {m.avatar || m.avatarUrl ? (
                          <img
                            src={m.avatar || m.avatarUrl}
                            alt={m.name}
                            className="h-6 w-6 rounded-full object-cover ring-1 ring-white/20"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 text-zinc-950 flex items-center justify-center text-[10px] font-bold">
                            {m.initials || m.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-xs">{m.name}</span>
                      </div>
                      {isAssigned && <Check className="h-3.5 w-3.5 text-[#579dff]" />}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* POPOVER: COVER PICKER */}
        {activePopover === 'cover' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#384148]">
              <span className="font-semibold text-xs text-[#9fadbc]">Cover</span>
              <button onClick={() => setActivePopover(null)} className="text-[#9fadbc] hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-[#9fadbc]">Colors</p>
            <div className="grid grid-cols-4 gap-2">
              {COVER_PALETTE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCoverColor(c.bg);
                    setCoverImage(null);
                    if (onUpdateCard && cardId) {
                      onUpdateCard(cardId, { coverColor: c.bg, coverImage: undefined });
                    }
                    setActivePopover(null);
                    showToast('Cover updated');
                  }}
                  className={`h-8 rounded ${c.bg} flex items-center justify-center cursor-pointer transition ${
                    coverColor === c.bg ? 'ring-2 ring-white scale-105' : 'hover:opacity-90'
                  }`}
                >
                  {coverColor === c.bg && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
            {coverColor && (
              <button
                type="button"
                onClick={() => {
                  setCoverColor(null);
                  setCoverImage(null);
                  if (onUpdateCard && cardId) {
                    onUpdateCard(cardId, { coverColor: undefined, coverImage: undefined });
                  }
                  setActivePopover(null);
                  showToast('Cover removed');
                }}
                className="w-full py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs text-[#b6c2cf] transition cursor-pointer"
              >
                Remove cover
              </button>
            )}
          </div>
        )}

        {/* POPOVER: LIST SELECTOR (TOP-LEFT) */}
        {activePopover === 'list-select' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#384148]">
              <span className="font-semibold text-xs text-[#9fadbc]">Move to list</span>
              <button onClick={() => setActivePopover(null)} className="text-[#9fadbc] hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              {allColumns.map((col) => {
                const isCurrent = col.title === currentColumnTitle;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleSelectTargetList(col)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left transition cursor-pointer ${
                      isCurrent ? 'bg-[#579dff]/20 text-[#85b8ff] font-semibold' : 'text-[#b6c2cf] hover:bg-[#a6c5e214]'
                    }`}
                  >
                    <span>{col.title}</span>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-[#579dff]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* POPOVER: THREE-DOTS CARD ACTION MENU (PICTURE 3) */}
        {activePopover === 'card-menu' && (
          <div className="space-y-0.5">
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#384148]">
              <span className="font-semibold text-xs text-[#9fadbc]">Card actions</span>
              <button onClick={() => setActivePopover(null)} className="text-[#9fadbc] hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setActivePopover(null);
                if (currentUser) {
                  handleToggleMember({
                    id: currentUser.id,
                    name: currentUser.full_name,
                    email: currentUser.email,
                    initials: userInitials,
                  });
                }
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <User className="w-3.5 h-3.5 text-white/60" />
              <span>Join</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePopover('list-select')}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <Move className="w-3.5 h-3.5 text-white/60" />
              <span>Move</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePopover(null);
                showToast('Card copied');
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <Copy className="w-3.5 h-3.5 text-white/60" />
              <span>Copy</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePopover(null);
                showToast('Mirror card created');
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <FileText className="w-3.5 h-3.5 text-white/60" />
              <span>Mirror</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePopover(null);
                showToast('Card converted to template');
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Make template</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsWatching(!isWatching);
                setActivePopover(null);
                showToast(isWatching ? 'Unwatched card' : 'Watching card');
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center justify-between transition text-[#b6c2cf]"
            >
              <div className="flex items-center gap-2.5">
                <Eye className="w-3.5 h-3.5 text-white/60" />
                <span>Watch</span>
              </div>
              {isWatching && <Check className="w-3.5 h-3.5 text-[#579dff]" />}
            </button>
            <div className="my-1 border-t border-[#384148]" />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setActivePopover(null);
                showToast('Card link copied to clipboard');
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <Share2 className="w-3.5 h-3.5 text-white/60" />
              <span>Share</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                setActivePopover(null);
                if (onArchiveCard && cardId) {
                  onArchiveCard(cardId);
                } else if (cardId && !cardId.startsWith('card-')) {
                  try {
                    await cardService.updateCard(cardId, { is_archived: true });
                  } catch (err) {
                    console.warn('Failed to archive card:', err);
                  }
                }
                onClose();
                showToast('Card archived');
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#a6c5e214] rounded flex items-center gap-2.5 transition text-[#b6c2cf]"
            >
              <Archive className="w-3.5 h-3.5 text-white/60" />
              <span>Archive</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePopover(null);
                if (onDeleteCard && cardId) onDeleteCard(cardId);
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-rose-500/10 text-rose-300 rounded flex items-center gap-2.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete card</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-2 sm:p-4 backdrop-blur-sm"
      onClick={(e) => {
        // Only close if clicking directly on the backdrop (not children)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] rounded-lg bg-emerald-500 text-zinc-950 px-4 py-2 text-xs font-bold shadow-2xl shadow-emerald-500/25 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Modal Container */}
      <div
        className="relative z-[101] flex flex-col w-full max-w-5xl max-h-[92vh] rounded-2xl border border-[#384148] bg-[#22272b] text-[#b6c2cf] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input - inside modal so it doesn't bubble to backdrop */}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" aria-hidden="true" />
        {/* Cover Banner Header (Pictures 2 & 3) */}
        <div
          className={`relative ${
            coverColor || coverImage ? 'h-28 sm:h-32' : 'h-14'
          } w-full shrink-0 transition-colors ${
            coverColor && coverColor.startsWith('bg-')
              ? coverColor
              : !coverColor && !coverImage
              ? 'bg-[#22272b] border-b border-[#384148]'
              : ''
          } flex flex-col justify-between p-3.5 rounded-t-2xl z-20`}
          style={coverColor && !coverColor.startsWith('bg-') ? { backgroundColor: coverColor } : undefined}
        >
          {coverImage && (
            <div className="absolute inset-0 overflow-hidden rounded-t-2xl pointer-events-none z-0">
              <img
                src={coverImage}
                alt="Cover"
                className="h-full w-full object-cover object-center"
              />
            </div>
          )}
          {/* Top Row on Cover: List Switcher (Left) & Actions (Right) */}
          <div className="flex items-center justify-between w-full relative z-30">
            {/* Top-Left List Switcher Dropdown */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'list-select' ? null : 'list-select')}
                className="flex items-center gap-1.5 rounded-md bg-black/40 hover:bg-black/60 text-white font-medium text-xs px-2.5 py-1 backdrop-blur-sm transition cursor-pointer"
              >
                <span>👋 {currentColumnTitle}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {activePopover === 'list-select' && renderPopoverBox('left')}
            </div>

            {/* Top-Right Control Buttons: Cover, Menu [...], Close [X] */}
            <div className="flex items-center gap-1.5">
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'cover' ? null : 'cover')}
                  className="flex h-7 w-7 items-center justify-center rounded bg-black/40 hover:bg-black/60 text-white transition backdrop-blur-sm cursor-pointer"
                  title="Cover"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                {activePopover === 'cover' && renderPopoverBox('right')}
              </div>

              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'card-menu' ? null : 'card-menu')}
                  className="flex h-7 w-7 items-center justify-center rounded bg-black/40 hover:bg-black/60 text-white transition backdrop-blur-sm cursor-pointer"
                  title="Card menu"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {activePopover === 'card-menu' && renderPopoverBox('right')}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded bg-black/40 hover:bg-black/60 text-white transition backdrop-blur-sm cursor-pointer"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Row on Cover: Remove Cover button */}
          <div className="flex justify-end relative z-10">
            {(coverColor || coverImage) && (
              <button
                type="button"
                onClick={() => {
                  setCoverColor(null);
                  setCoverImage(null);
                  if (onUpdateCard && cardId) onUpdateCard(cardId, { coverColor: null, coverImage: null });
                  showToast('Cover removed');
                }}
                className="rounded bg-black/40 hover:bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 backdrop-blur-sm transition cursor-pointer"
              >
                Remove cover
              </button>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body: 2-Column Split Layout */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* ======================================================== */}
            {/* LEFT COLUMN: Title, Quick Chips, Description, Checklists */}
            {/* ======================================================== */}
            <div className="lg:col-span-7 space-y-6">
              {/* Title Section with Green Completion Checkmark */}
              <div className="flex items-start gap-3">
                {/* Green Circular Checkmark (Picture 2 & 3) */}
                <button
                  type="button"
                  onClick={handleToggleCardCompletion}
                  className={`mt-1 h-6 w-6 rounded-full shrink-0 flex items-center justify-center transition cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-600 border-2 border-emerald-500 text-white shadow-sm'
                      : 'border-2 border-[#738496] hover:border-emerald-400 hover:bg-emerald-500/15 text-transparent hover:text-emerald-400'
                  }`}
                  title={isCompleted ? 'Mark card incomplete' : 'Mark card complete'}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                {/* Card Title Inline Editor */}
                <div className="flex-1 min-w-0">
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                      autoFocus
                      className="w-full rounded bg-[#1d2125] border border-[#579dff] px-2.5 py-1 text-lg font-bold text-white focus:outline-none"
                    />
                  ) : (
                    <h2
                      onClick={() => setIsEditingTitle(true)}
                      className={`text-lg sm:text-xl font-bold tracking-tight text-[#dcdfe4] hover:bg-[#a6c5e214] rounded px-1.5 py-0.5 -ml-1.5 cursor-pointer transition ${
                        isCompleted ? 'line-through opacity-70' : ''
                      }`}
                      title="Click to edit title"
                    >
                      {title || 'Untitled Card'}
                    </h2>
                  )}
                </div>
              </div>

              {/* Horizontal Quick Action Chips Bar (Picture 2 & 3) */}
              <div className="flex flex-wrap items-center gap-1.5 pl-9">
                {/* + Add Chip Button */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setActivePopover(activePopover === 'add' ? null : 'add')}
                    className="flex items-center gap-1 rounded bg-[#2c333a] hover:bg-[#323940] px-2.5 py-1 text-xs font-medium text-[#b6c2cf] hover:text-white transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                  {activePopover === 'add' && renderPopoverBox()}
                </div>

                {/* Attachment Chip Button */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setActivePopover(activePopover === 'attachment' ? null : 'attachment')}
                    className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                      activePopover === 'attachment'
                        ? 'bg-[#579dff] text-black font-semibold'
                        : 'bg-[#2c333a] hover:bg-[#323940] text-[#b6c2cf] hover:text-white'
                    }`}
                  >
                    <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Attachment</span>
                    {attachments.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                        {attachments.length}
                      </span>
                    )}
                  </button>
                  {activePopover === 'attachment' && renderPopoverBox()}
                </div>

                {/* Labels Chip Button */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setActivePopover(activePopover === 'labels' ? null : 'labels')}
                    className="flex items-center gap-1.5 rounded bg-[#2c333a] hover:bg-[#323940] px-2.5 py-1 text-xs font-medium text-[#b6c2cf] hover:text-white transition cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    <span>Labels</span>
                  </button>
                  {activePopover === 'labels' && renderPopoverBox()}
                </div>

                {/* Dates Chip Button */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setActivePopover(activePopover === 'dates' ? null : 'dates')}
                    className="flex items-center gap-1.5 rounded bg-[#2c333a] hover:bg-[#323940] px-2.5 py-1 text-xs font-medium text-[#b6c2cf] hover:text-white transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dates</span>
                  </button>
                  {activePopover === 'dates' && renderPopoverBox()}
                </div>

                {/* Checklist Chip Button */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setActivePopover(activePopover === 'checklist' ? null : 'checklist')}
                    className="flex items-center gap-1.5 rounded bg-[#2c333a] hover:bg-[#323940] px-2.5 py-1 text-xs font-medium text-[#b6c2cf] hover:text-white transition cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Checklist</span>
                  </button>
                  {activePopover === 'checklist' && renderPopoverBox()}
                </div>

                {/* Members Chip Button */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setActivePopover(activePopover === 'members' ? null : 'members')}
                    className="flex items-center gap-1.5 rounded bg-[#2c333a] hover:bg-[#323940] px-2.5 py-1 text-xs font-medium text-[#b6c2cf] hover:text-white transition cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>Members</span>
                  </button>
                  {activePopover === 'members' && renderPopoverBox()}
                </div>
              </div>

              {/* Active Metadata Badges Display */}
              {(labels.length > 0 || members.length > 0 || dueDate) && (
                <div className="flex flex-wrap items-center gap-4 pl-9 pt-1">
                  {/* Labels */}
                  {labels.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {labels.map((l) => (
                        <span
                          key={l.id}
                          onClick={() => setActivePopover('labels')}
                          className={`rounded px-2.5 py-0.5 text-[11px] font-semibold cursor-pointer hover:opacity-80 transition ${
                            l.colorBg || 'bg-blue-500/20'
                          } ${l.colorBorder || 'border border-blue-500/40'} ${l.colorText || 'text-blue-300'}`}
                        >
                          {l.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Members Avatars */}
                  {members.length > 0 && (
                    <div className="flex items-center gap-1">
                      {members.map((m) =>
                        m.avatar || m.avatarUrl ? (
                          <img
                            key={m.id}
                            src={m.avatar || m.avatarUrl}
                            alt={m.name}
                            onClick={() => setActivePopover('members')}
                            className="h-6 w-6 rounded-full object-cover cursor-pointer ring-1 ring-white/20"
                            title={m.name}
                          />
                        ) : (
                          <div
                            key={m.id}
                            onClick={() => setActivePopover('members')}
                            className="h-6 w-6 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 text-zinc-950 flex items-center justify-center text-[10px] font-bold cursor-pointer ring-1 ring-white/20"
                            title={m.name}
                          >
                            {m.initials || m.name.slice(0, 2).toUpperCase()}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Due Date Chip */}
                  {dueDate && (
                    <div
                      onClick={() => setActivePopover('dates')}
                      className="flex items-center gap-1.5 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs text-amber-300 cursor-pointer hover:bg-amber-500/25 transition"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{dueDate}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description Section with Rich Markdown Toolbar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-[#9fadbc]" />
                    <h3 className="text-sm font-bold text-[#dcdfe4]">Description</h3>
                  </div>
                  {!isEditingDesc && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDesc(true)}
                      className="rounded bg-[#2c333a] hover:bg-[#323940] px-2.5 py-1 text-xs font-semibold text-[#b6c2cf] hover:text-white transition cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-2">
                    {/* Rich Markdown Formatting Toolbar (Picture 3) */}
                    <div className="flex flex-wrap items-center gap-1 p-1 rounded-t-lg bg-[#1d2125] border border-[#384148] border-b-0 text-[#9fadbc]">
                      <button
                        type="button"
                        onClick={() => insertFormatting('### ', '')}
                        className="px-2 py-1 rounded hover:bg-white/10 text-xs font-semibold hover:text-white"
                        title="Heading"
                      >
                        Tt ⌵
                      </button>
                      <div className="h-4 w-px bg-[#384148] mx-0.5" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('**', '**', 'bold text')}
                        className="p-1.5 rounded hover:bg-white/10 hover:text-white"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('*', '*', 'italic text')}
                        className="p-1.5 rounded hover:bg-white/10 hover:text-white"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('~~', '~~', 'strikethrough')}
                        className="p-1.5 rounded hover:bg-white/10 hover:text-white"
                        title="Strikethrough"
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-4 w-px bg-[#384148] mx-0.5" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n- ', '')}
                        className="p-1.5 rounded hover:bg-white/10 hover:text-white"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n1. ', '')}
                        className="p-1.5 rounded hover:bg-white/10 hover:text-white"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-4 w-px bg-[#384148] mx-0.5" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('[', '](https://)', 'link title')}
                        className="p-1.5 rounded hover:bg-white/10 hover:text-white"
                        title="Insert Link"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('`', '`', 'code')}
                        className="p-1.5 rounded hover:bg-white/10 hover:text-white"
                        title="Inline Code"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n> ', '')}
                        className="p-1.5 rounded hover:bg-white/10 hover:text-white"
                        title="Quote"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('@', '')}
                        className="p-1.5 rounded hover:bg-white/10 hover:text-white"
                        title="Mention Member"
                      >
                        <AtSign className="w-3.5 h-3.5" />
                      </button>
                      <span className="ml-auto text-[10px] text-[#9fadbc] px-2 font-mono flex items-center gap-1">
                        <span>M↓</span>
                      </span>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={descTextareaRef}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      placeholder="Add a more detailed description..."
                      className="w-full rounded-b-lg border border-[#384148] bg-[#1d2125] p-3 text-xs text-[#dcdfe4] placeholder-[#9fadbc]/50 focus:outline-none focus:border-[#579dff] font-sans leading-relaxed custom-scrollbar"
                    />

                    {/* Save & Cancel buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveDescription}
                        className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 px-4 py-1.5 text-xs font-bold text-zinc-950 shadow-sm shadow-emerald-500/20 transition cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDesc(false)}
                        className="rounded hover:bg-[#a6c5e214] px-3 py-1.5 text-xs font-medium text-[#b6c2cf] hover:text-white transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDesc(true)}
                    className="rounded-lg bg-[#1d2125]/80 hover:bg-[#1d2125] border border-transparent hover:border-[#384148] p-3 text-xs leading-relaxed text-[#dcdfe4] cursor-pointer whitespace-pre-line transition min-h-[72px]"
                  >
                    {description ? (
                      description
                    ) : (
                      <span className="text-[#9fadbc]/60 italic">Add a more detailed description...</span>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments Section - Prominently Displayed Under Description */}
              {attachments.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-[#579dff]" />
                      <h4 className="text-sm font-bold text-[#dcdfe4]">
                        Attachments
                        <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#2c333a] text-[#85b8ff]">
                          {attachments.length}
                        </span>
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePopover('attachment')}
                      className="rounded bg-[#2c333a] hover:bg-[#323940] px-2.5 py-1 text-xs font-semibold text-[#b6c2cf] hover:text-white transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {attachments.map((att) => {
                      const isImg =
                        att.type === 'image' ||
                        (att.url && (att.url.startsWith('data:image') || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(att.url || att.name)));
                      const isCover = coverImage === att.url;

                      return (
                        <div
                          key={att.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-xl bg-[#1d2125] border border-[#384148] hover:border-[#579dff]/40 transition group gap-3"
                        >
                          {/* Left: Thumbnail & Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Thumbnail / Icon preview */}
                            {isImg && att.url ? (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-24 h-16 rounded-lg overflow-hidden border border-white/10 bg-black/40 shrink-0 block group/thumb relative"
                                title="View full image"
                              >
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="w-full h-full object-cover transition duration-200 group-hover/thumb:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition text-white">
                                  <ExternalLink className="w-4 h-4" />
                                </div>
                              </a>
                            ) : (
                              <div className="w-16 h-16 rounded-lg border border-[#384148] bg-[#22272b] shrink-0 flex flex-col items-center justify-center gap-1 text-[#85b8ff]">
                                {att.type === 'link' ? (
                                  <Link2 className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <FileText className="w-5 h-5 text-blue-400" />
                                )}
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#9fadbc]">
                                  {att.type === 'link' ? 'LINK' : att.name.split('.').pop()?.slice(0, 4) || 'FILE'}
                                </span>
                              </div>
                            )}

                            {/* Title & Metadata */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {att.url ? (
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-xs text-white hover:text-[#579dff] hover:underline truncate max-w-xs block"
                                    title={att.name}
                                  >
                                    {att.name}
                                  </a>
                                ) : (
                                  <span className="font-bold text-xs text-white truncate max-w-xs block">
                                    {att.name}
                                  </span>
                                )}
                                {isCover && (
                                  <span className="text-[10px] bg-blue-500/20 border border-blue-500/40 text-blue-300 font-semibold px-1.5 py-0.2 rounded flex items-center gap-1">
                                    <ImageIcon className="w-2.5 h-2.5" /> Cover
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-[#9fadbc] mt-0.5">
                                Added {att.uploadedAt} • {att.size}
                              </p>

                              {/* Actions row */}
                              <div className="flex items-center gap-2 mt-1.5 text-xs text-[#9fadbc]">
                                {att.url && (
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-white underline text-[11px] flex items-center gap-1 transition"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Open</span>
                                  </a>
                                )}
                                {isImg && att.url && (
                                  <>
                                    <span>•</span>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAttachmentCover(att)}
                                      className="hover:text-white underline text-[11px] flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <ImageIcon className="w-3 h-3" />
                                      <span>{isCover ? 'Remove cover' : 'Make cover'}</span>
                                    </button>
                                  </>
                                )}
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttachment(att.id)}
                                  className="hover:text-rose-400 underline text-[11px] flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Checklists (Multi-Checklists) */}
              {checklists.map((cl) => {
                const total = cl.items.length;
                const completed = cl.items.filter((i) => i.is_completed).length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div key={cl.id} className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-[#579dff]" />
                        <h4 className="text-xs font-bold text-[#dcdfe4]">{cl.title}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-[#9fadbc]">{percent}%</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteChecklist(cl.id)}
                          className="text-[#9fadbc] hover:text-rose-400 text-xs p-1"
                          title="Delete checklist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-[#1d2125] rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-[#579dff] transition-all duration-300 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Items */}
                    <div className="space-y-1">
                      {cl.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleChecklistItem(cl.id, item.id)}
                          className="group flex items-center justify-between gap-2.5 p-1.5 rounded hover:bg-[#a6c5e214] cursor-pointer transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={item.is_completed}
                              onChange={() => {}}
                              className="h-4 w-4 rounded bg-[#1d2125] border-[#738496] text-[#579dff] focus:ring-0 cursor-pointer accent-[#579dff]"
                            />
                            <span
                              className={`text-xs ${
                                item.is_completed ? 'line-through text-[#9fadbc]/60' : 'text-[#dcdfe4]'
                              }`}
                            >
                              {item.text}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChecklistItem(cl.id, item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[#9fadbc] hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Inline Add item */}
                    {addingItemForClId === cl.id ? (
                      <div className="space-y-2 pl-6 pt-1">
                        <input
                          type="text"
                          placeholder="Add an item..."
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddItem(cl.id)}
                          autoFocus
                          className="w-full rounded bg-[#1d2125] border border-[#579dff] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddItem(cl.id)}
                            className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 px-3 py-1 text-xs font-bold text-zinc-950 shadow-sm shadow-emerald-500/20 transition cursor-pointer"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingItemForClId(null)}
                            className="rounded hover:bg-[#a6c5e214] px-2.5 py-1 text-xs text-[#b6c2cf] hover:text-white transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingItemForClId(cl.id);
                          setNewItemText('');
                        }}
                        className="ml-6 rounded bg-[#2c333a] hover:bg-[#323940] px-3 py-1 text-xs font-medium text-[#b6c2cf] hover:text-white transition cursor-pointer"
                      >
                        + Add an item
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: Comments and activity Feed (Picture 2 & 3) */}
            {/* ======================================================== */}
            <div className="lg:col-span-5 space-y-4 border-t lg:border-t-0 lg:border-l border-[#384148] pt-6 lg:pt-0 lg:pl-6">
              {/* Header with "Hide details" / "Show details" button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#9fadbc]" />
                  <h3 className="text-sm font-bold text-[#dcdfe4]">Comments and activity</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="rounded bg-[#2c333a] hover:bg-[#323940] px-2.5 py-1 text-xs font-medium text-[#b6c2cf] hover:text-white transition cursor-pointer"
                >
                  {showDetails ? 'Hide details' : 'Show details'}
                </button>
              </div>

              {/* Comment Input Box (Picture 2 & 3) */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={() => setIsCommentFocused(true)}
                    placeholder="Write a comment..."
                    className="w-full rounded bg-[#1d2125] border border-[#738496] px-3 py-2 text-xs text-white placeholder-[#9fadbc] focus:outline-none focus:border-[#579dff] transition"
                  />
                </div>
                {(isCommentFocused || newComment.trim()) && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-40 px-3.5 py-1.5 text-xs font-bold text-zinc-950 shadow-sm shadow-emerald-500/20 transition cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCommentFocused(false);
                        setNewComment('');
                      }}
                      className="rounded hover:bg-[#a6c5e214] px-2.5 py-1.5 text-xs font-medium text-[#b6c2cf] hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Chronological Activity & Comments Feed (Picture 2 & 3) */}
              <div className="space-y-3 pt-2 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                {timelineItems
                  .filter((it) => (showDetails ? true : it.type === 'comment'))
                  .map((item) => (
                    <div key={item.id} className="flex items-start gap-2.5 text-xs">
                      {/* User Avatar Circle (AK) */}
                      <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 text-zinc-950 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {item.authorInitials || 'AK'}
                      </div>

                      {/* Feed content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        {item.type === 'activity' ? (
                          <div className="leading-snug">
                            <span className="font-semibold text-white">{item.authorName} </span>
                            <span className="text-[#b6c2cf]">{item.actionText}</span>
                            <div className="text-[11px] text-[#579dff] hover:underline cursor-pointer">
                              {item.createdAt}
                            </div>
                          </div>
                        ) : (
                          /* User Comment Box */
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">{item.authorName}</span>
                              <span className="text-[10px] text-[#9fadbc]">{item.createdAt}</span>
                            </div>
                            <div className="rounded-md bg-[#1d2125] border border-[#384148] p-2 text-xs text-[#dcdfe4] leading-relaxed">
                              {item.content}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#9fadbc]">
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(item.id)}
                                className="hover:underline hover:text-rose-400"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                {timelineItems.length === 0 && (
                  <p className="text-xs text-[#9fadbc]/60 italic py-3 text-center">
                    No comments or activity yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CardDetailModal;
