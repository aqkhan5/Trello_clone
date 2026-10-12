import React, { useState } from 'react';
import {
  X,
  CreditCard,
  AlignLeft,
  CheckSquare,
  Clock,
  Paperclip,
  Activity,
  Tag,
  User,
  Plus,
  Eye,
  CheckCircle2,
  Trash2,
  Copy,
  Move,
  Archive,
  Calendar,
  Share2,
  MoreHorizontal,
  ChevronDown,
  Sparkles,
  Send,
  CornerDownRight,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export interface CardLabel {
  id: string;
  name: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
}

export interface CardMember {
  id: string;
  name: string;
  avatarUrl: string;
  initials?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CardComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  isEdited?: boolean;
}

export interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: string;
  columnTitle?: string;
  initialTitle?: string;
}

// ==========================================
// 2. CARD INSPECTION & EDIT MODAL
// ==========================================

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  isOpen,
  onClose,
  columnTitle = 'Project Foundation',
  initialTitle = 'Schema Migration Engine: Prisma ORM vs Kysely Query Builder'
}) => {
  if (!isOpen) return null;

  // Local Component State
  const [title, setTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isWatching, setIsWatching] = useState(true);

  // Labels
  const [labels, setLabels] = useState<CardLabel[]>([
    { id: 'l1', name: 'Database', colorBg: 'bg-blue-500/20', colorBorder: 'border-blue-500/40', colorText: 'text-blue-300' },
    { id: 'l2', name: 'P1 High', colorBg: 'bg-rose-500/20', colorBorder: 'border-rose-500/40', colorText: 'text-rose-300' },
    { id: 'l3', name: 'Architecture', colorBg: 'bg-purple-500/20', colorBorder: 'border-purple-500/40', colorText: 'text-purple-300' }
  ]);

  // Members
  const [members, setMembers] = useState<CardMember[]>([
    { id: 'm1', name: 'Alex Rivera (Tech Lead)', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop' },
    { id: 'm2', name: 'Marcus Dev', avatarUrl: '', initials: 'MD' }
  ]);

  // Description
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(
    `Evaluate both migration strategies for zero-downtime schema alteration on Amazon RDS PostgreSQL 16.\n\nKey Requirements:\n- Explicit raw SQL down-migration script rollback tests\n- Strict TypeScript typing validation with kysely-codegen\n- Latency benchmarks comparing Prisma Client query engine overhead vs raw Kysely builder`
  );

  // Checklist Items
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'c1', text: 'Define Board, List, and Card schema models in Prisma DDL', completed: true },
    { id: 'c2', text: 'Generate database baseline migration script', completed: true },
    { id: 'c3', text: 'Benchmark 50k batch insertion with Kysely transactional pool', completed: true },
    { id: 'c4', text: 'Implement automated schema parity CI check in GitHub Actions', completed: true },
    { id: 'c5', text: 'Audit query execution plans for board card sorting indexes', completed: true },
    { id: 'c6', text: 'Document roll-forward and roll-back CLI runbook', completed: false },
    { id: 'c7', text: 'Team review and sign-off on connection pooling limits', completed: false }
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isAddingChecklistItem, setIsAddingChecklistItem] = useState(false);

  // Comments
  const [comments, setComments] = useState<CardComment[]>([
    {
      id: 'cm1',
      authorName: 'Alex Rivera',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop',
      content: 'I ran the local Postgres stress test with 10k cards per column. Kysely raw query overhead is negligible (~1.4ms vs Prisma 7.8ms). Recommend Kysely for high-frequency board websocket events.',
      createdAt: 'Yesterday at 4:32 PM'
    },
    {
      id: 'cm2',
      authorName: 'Sarah Jenkins',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      content: 'Added the rollback verification step into the checklist. Please test the Prisma down-migration locally before merging into staging.',
      createdAt: '2 hours ago'
    }
  ]);
  const [newComment, setNewComment] = useState('');

  // Calculations
  const completedCount = checklist.filter(c => c.completed).length;
  const progressPercent = Math.round((completedCount / (checklist.length || 1)) * 100);

  const toggleChecklist = (id: string) => {
    setChecklist(items =>
      items.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      { id: `c-${Date.now()}`, text: newChecklistText.trim(), completed: false }
    ]);
    setNewChecklistText('');
    setIsAddingChecklistItem(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: `cm-${Date.now()}`,
        authorName: 'Current User',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop',
        content: newComment.trim(),
        createdAt: 'Just now'
      }
    ]);
    setNewComment('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-white shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Optional Cover Banner Header */}
        <div className="relative h-44 w-full overflow-hidden bg-zinc-800 border-b border-white/10">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop"
            alt="Card Cover"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40" />

          {/* Close modal X button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-black/80 hover:text-white transition backdrop-blur-sm"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Change cover button */}
          <button className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-md bg-black/60 hover:bg-black/80 px-3 py-1.5 text-xs font-medium text-white/90 transition backdrop-blur-md">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Cover</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Header Title Section */}
          <div className="flex items-start gap-3.5">
            <CreditCard className="h-5 w-5 text-blue-400 mt-1 shrink-0" />
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
                  autoFocus
                  className="w-full rounded-md border border-blue-500 bg-zinc-800 px-2 py-1 text-xl font-bold text-white focus:outline-none"
                />
              ) : (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="text-xl font-bold tracking-tight text-white/95 hover:bg-white/5 rounded px-1.5 py-0.5 -ml-1.5 cursor-pointer transition"
                >
                  {title}
                </h2>
              )}
              <p className="text-xs text-white/50 mt-1">
                in list <span className="text-white/80 font-medium underline underline-offset-2">{columnTitle}</span>
              </p>
            </div>

            {/* Watch Card Button */}
            <button
              onClick={() => setIsWatching(!isWatching)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                isWatching
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{isWatching ? 'Watching' : 'Watch'}</span>
              {isWatching && <CheckCircle2 className="h-3 w-3 text-blue-400 ml-0.5" />}
            </button>
          </div>

          {/* 2-Column Split: Content vs Actions */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Metadata, Description, Checklist, Comments (8 cols) */}
            <div className="md:col-span-8 space-y-7">
              {/* Metadata Badges (Members & Labels Row) */}
              <div className="flex flex-wrap gap-6 items-start">
                {/* Members */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">Members</h4>
                  <div className="flex items-center gap-1.5">
                    {members.map(m =>
                      m.avatarUrl ? (
                        <img
                          key={m.id}
                          src={m.avatarUrl}
                          alt={m.name}
                          title={m.name}
                          className="h-8 w-8 rounded-full border border-white/20 object-cover ring-2 ring-zinc-900"
                        />
                      ) : (
                        <div
                          key={m.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white ring-2 ring-zinc-900"
                          title={m.name}
                        >
                          {m.initials}
                        </div>
                      )
                    )}
                    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">Labels</h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {labels.map(label => (
                      <span
                        key={label.id}
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${label.colorBg} ${label.colorBorder} ${label.colorText}`}
                      >
                        {label.name}
                      </span>
                    ))}
                    <button className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Due Date Indicator */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">Due Date</h4>
                  <div className="flex items-center gap-2 rounded-md bg-white/10 border border-white/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Oct 26, 5:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Description Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <AlignLeft className="h-4 w-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white/90">Description</h3>
                  </div>
                  {!isEditingDesc && (
                    <button
                      onClick={() => setIsEditingDesc(true)}
                      className="rounded-md bg-white/10 hover:bg-white/15 px-2.5 py-1 text-xs font-medium text-white/80 transition"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-blue-500/50 bg-zinc-800 p-3 text-xs text-white/90 placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingDesc(false)}
                        className="rounded-md bg-[#0052cc] hover:bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingDesc(false)}
                        className="rounded-md hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDesc(true)}
                    className="rounded-xl bg-zinc-800/60 hover:bg-zinc-800/80 border border-white/5 p-3.5 text-xs leading-relaxed text-white/80 cursor-pointer whitespace-pre-line transition"
                  >
                    {description}
                  </div>
                )}
              </div>

              {/* Checklist Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckSquare className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white/90">Implementation Checklist</h3>
                  </div>
                  <span className="text-xs font-semibold text-white/50">{progressPercent}%</span>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800 border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Checklist items list */}
                <div className="space-y-1.5 pt-1">
                  {checklist.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className="group flex items-start gap-3 rounded-lg p-2 hover:bg-white/5 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {}}
                        className="h-4 w-4 mt-0.5 rounded border-white/20 bg-zinc-800 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-600"
                      />
                      <span
                        className={`text-xs flex-1 transition ${
                          item.completed ? 'text-white/40 line-through' : 'text-white/90'
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add an item input trigger */}
                {isAddingChecklistItem ? (
                  <div className="mt-2 space-y-2 pl-7">
                    <input
                      type="text"
                      placeholder="Add an item..."
                      value={newChecklistText}
                      onChange={e => setNewChecklistText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                      autoFocus
                      className="w-full rounded-lg border border-blue-500 bg-zinc-800 px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddChecklistItem}
                        className="rounded-md bg-[#0052cc] hover:bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setIsAddingChecklistItem(false)}
                        className="rounded-md hover:bg-white/10 px-2 py-1 text-xs text-white/60 hover:text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingChecklistItem(true)}
                    className="ml-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white transition"
                  >
                    Add an item
                  </button>
                )}
              </div>

              {/* Activity & Comments Timeline */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Activity className="h-4 w-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white/90">Activity & Comments</h3>
                  </div>
                  <button className="rounded-md bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/60">
                    Show Details
                  </button>
                </div>

                {/* New Comment Box */}
                <div className="flex items-start gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop"
                    alt="User"
                    className="h-8 w-8 rounded-full border border-white/20 object-cover mt-0.5"
                  />
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Write a comment, report benchmark results, or tag @teammate..."
                      rows={2}
                      className="w-full rounded-xl border border-white/10 bg-zinc-800 p-3 text-xs text-white placeholder-white/40 focus:border-blue-500 focus:outline-none transition"
                    />
                    {newComment.trim() && (
                      <button
                        onClick={handleAddComment}
                        className="flex items-center gap-1.5 rounded-md bg-[#0052cc] hover:bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition"
                      >
                        <Send className="h-3 w-3" />
                        <span>Save comment</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3.5 pl-11">
                  {comments.map(comment => (
                    <div key={comment.id} className="rounded-xl bg-zinc-800/70 border border-white/5 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white/90">{comment.authorName}</span>
                        <span className="text-[10px] text-white/40">{comment.createdAt}</span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">{comment.content}</p>
                      <div className="flex items-center gap-3 pt-1 text-[10px] text-white/40">
                        <button className="hover:text-white underline">Reply</button>
                        <span>•</span>
                        <button className="hover:text-white underline">Edit</button>
                        <span>•</span>
                        <button className="hover:text-rose-400 underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Action Sidebar (4 cols) */}
            <div className="md:col-span-4 space-y-5">
              {/* "Add to card" actions */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">Add to card</h4>
                <div className="space-y-1.5">
                  {[
                    { label: 'Members', icon: User },
                    { label: 'Labels', icon: Tag },
                    { label: 'Checklist', icon: CheckSquare },
                    { label: 'Dates', icon: Calendar },
                    { label: 'Attachment', icon: Paperclip },
                    { label: 'Cover', icon: ImageIcon },
                    { label: 'Custom Fields', icon: Sliders }
                  ].map((action, idx) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={idx}
                        className="flex w-full items-center gap-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white transition shadow-xs"
                      >
                        <Icon className="h-3.5 w-3.5 text-white/60" />
                        <span>{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Actions */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">Actions</h4>
                <div className="space-y-1.5">
                  <button className="flex w-full items-center gap-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white transition">
                    <Move className="h-3.5 w-3.5 text-white/60" />
                    <span>Move</span>
                  </button>
                  <button className="flex w-full items-center gap-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white transition">
                    <Copy className="h-3.5 w-3.5 text-white/60" />
                    <span>Copy</span>
                  </button>
                  <button className="flex w-full items-center gap-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white transition">
                    <Share2 className="h-3.5 w-3.5 text-white/60" />
                    <span>Share</span>
                  </button>

                  <div className="my-2 border-t border-white/10" />

                  <button className="flex w-full items-center gap-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white transition">
                    <Archive className="h-3.5 w-3.5 text-white/60" />
                    <span>Archive</span>
                  </button>
                  <button className="flex w-full items-center gap-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 transition">
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                    <span>Delete Card</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;
