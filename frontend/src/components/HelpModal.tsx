// src/components/HelpModal.tsx
import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Command,
  BookOpen,
  Sparkles,
  Layers,
  Kanban,
  CheckSquare,
  Shield,
  Info,
} from 'lucide-react';

export interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'tips' | 'about'>('shortcuts');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl text-white overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Help & Keyboard Shortcuts</h2>
              <p className="text-[11px] text-white/50">Master Quasha with shortcuts and productivity tips</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/5 bg-black/20 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'shortcuts'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Command className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tips')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'tips'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tips & Guides</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'about'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: Shortcuts */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Global Navigation
                </span>
                <div className="space-y-1 rounded-xl bg-black/40 border border-white/10 p-2 divide-y divide-white/5">
                  {[
                    { keys: ['Ctrl', 'K'], label: 'Global Search (cards, lists, boards)' },
                    { keys: ['?'], label: 'Open Help & Shortcuts Guide' },
                    { keys: ['Esc'], label: 'Close any open modal, menu, or search dialog' },
                  ].map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-2 text-xs">
                      <span className="text-white/80">{s.label}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map((k) => (
                          <kbd
                            key={k}
                            className="px-2 py-0.5 rounded-md border border-white/20 bg-white/10 text-[10px] font-mono text-white/90 shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Board & Cards
                </span>
                <div className="space-y-1 rounded-xl bg-black/40 border border-white/10 p-2 divide-y divide-white/5">
                  {[
                    { keys: ['B'], label: 'Open slide-in Board Menu' },
                    { keys: ['F'], label: 'Filter cards on the board' },
                    { keys: ['Space'], label: 'Quickly assign / unassign yourself to card' },
                    { keys: ['Enter'], label: 'Open card detail modal' },
                    { keys: ['C'], label: 'Archive card' },
                    { keys: ['N'], label: 'Add a new card to active list' },
                  ].map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-2 text-xs">
                      <span className="text-white/80">{s.label}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map((k) => (
                          <kbd
                            key={k}
                            className="px-2 py-0.5 rounded-md border border-white/20 bg-white/10 text-[10px] font-mono text-white/90 shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Tips & Guides */}
          {activeTab === 'tips' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Kanban className="w-4 h-4 text-blue-400" />
                  Boards & Workspaces
                </h4>
                <p className="text-white/70 text-[11px]">
                  Workspaces group projects and team members together. You can invite teammates, define roles, and create dedicated boards for marketing, engineering, or operations.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Fractional Drag-and-Drop
                </h4>
                <p className="text-white/70 text-[11px]">
                  Lists and cards utilize an advanced fractional index scale (65,536 intervals), allowing instant rearrangement between columns without database re-indexing delays.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                  Card Detail & Attachments
                </h4>
                <p className="text-white/70 text-[11px]">
                  Click any card to upload image or file attachments, create colored label tags, set due dates, assign team members, and check off checklist items.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Member Permissions
                </h4>
                <p className="text-white/70 text-[11px]">
                  Manage workspace and board permissions via the settings modal. Assign Admin, Member, or Observer roles to maintain control over sensitive projects.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: About */}
          {activeTab === 'about' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Quasha Workspace Engine
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
                    v2.5.0
                  </span>
                </div>
                <p className="text-white/70 text-[11px] leading-relaxed">
                  A high-performance modern team collaboration platform built with FastAPI, PostgreSQL, React, Vite, and Tailwind CSS.
                </p>
              </div>

              <div className="space-y-2 rounded-xl bg-black/40 border border-white/10 p-3 divide-y divide-white/5">
                <div className="flex items-center justify-between py-1.5 text-xs">
                  <span className="text-white/60">Backend Service</span>
                  <span className="font-mono text-emerald-400 text-[11px]">FastAPI Async Gateway</span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-xs">
                  <span className="text-white/60">Database</span>
                  <span className="font-mono text-white/90 text-[11px]">PostgreSQL 16 + Alembic</span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-xs">
                  <span className="text-white/60">Frontend Architecture</span>
                  <span className="font-mono text-white/90 text-[11px]">React 18 + Vite + TypeScript</span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-xs">
                  <span className="text-white/60">Positioning System</span>
                  <span className="font-mono text-white/90 text-[11px]">65,536 Fractional Scale</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-white/50 shrink-0">
          <span>Press ESC or click outside to dismiss</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-zinc-950 font-bold shadow-sm shadow-emerald-500/20 transition cursor-pointer text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
