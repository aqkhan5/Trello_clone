import React, { useState } from 'react';
import { X, Check, Globe, Lock, Users, Sparkles, Layout } from 'lucide-react';

export interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (boardData: { title: string; background: string; visibility: string }) => void;
}

const BACKGROUND_PRESETS = [
  {
    id: 'alpine',
    title: 'Alpine Dusk Reflection',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    type: 'image',
  },
  {
    id: 'forest',
    title: 'Deep Forest Twilight',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    type: 'image',
  },
  {
    id: 'cosmic',
    title: 'Cosmic Starry Night',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    type: 'image',
  },
  {
    id: 'ocean',
    title: 'Ocean Sunset Horizon',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    type: 'image',
  },
];

const GRADIENT_PRESETS = [
  { id: 'blue', gradient: 'linear-gradient(135deg, #003d9b, #0052cc)', title: 'Atlassian Blue' },
  { id: 'teal', gradient: 'linear-gradient(135deg, #004e32, #006844)', title: 'Emerald Teal' },
  { id: 'purple', gradient: 'linear-gradient(135deg, #285ab9, #709bfe)', title: 'Royal Purple' },
  { id: 'twilight', gradient: 'linear-gradient(135deg, #003d9b, #004e32)', title: 'Warm Twilight' },
  { id: 'midnight', gradient: 'linear-gradient(135deg, #1d3054, #051a3e)', title: 'Midnight Slate' },
];

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  onCreateBoard,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [selectedBg, setSelectedBg] = useState('');
  const [visibility, setVisibility] = useState('workspace');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateBoard({
      title: title.trim(),
      background: selectedBg,
      visibility,
    });
    onClose();
  };

  const isGradient = selectedBg.startsWith('linear-gradient');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-900 text-white rounded-2xl border border-white/10 shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0052cc] text-white flex items-center justify-center">
              <Layout className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Create board</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview */}
        <div
          className="relative w-full h-28 rounded-xl overflow-hidden shadow-lg p-3 flex flex-col justify-between mb-4 transition-all duration-300 bg-zinc-950 border border-white/10"
          style={
            selectedBg
              ? {
                  backgroundImage: isGradient ? selectedBg : `url('${selectedBg}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 backdrop-blur-xs text-[10px] text-white/90 font-medium">
              {visibility === 'workspace' && <Users className="w-3 h-3" />}
              {visibility === 'private' && <Lock className="w-3 h-3" />}
              {visibility === 'public' && <Globe className="w-3 h-3" />}
              <span className="capitalize">{visibility}</span>
            </span>
            <span className="text-[10px] text-white/60">
              {!selectedBg ? 'System Default (No Picture)' : 'Custom Background'}
            </span>
          </div>

          <div className="relative z-10 font-bold text-sm text-white drop-shadow">
            {title || 'Board Title'}
          </div>
        </div>

        {/* Background Selector */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-2">Background</label>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {/* System Default (No Picture) */}
              <button
                type="button"
                onClick={() => setSelectedBg('')}
                className={`relative h-12 rounded-lg bg-zinc-950 border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  !selectedBg ? 'border-blue-500 ring-2 ring-blue-500/40 text-blue-400' : 'border-white/15 hover:border-white/40 text-white/60'
                }`}
                title="System Default (Clean Dark Theme)"
              >
                <Layout className="w-4 h-4 mb-0.5" />
                <span className="text-[9px] font-bold">Default</span>
                {!selectedBg && (
                  <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
              </button>

              {BACKGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedBg(preset.url)}
                  className={`relative h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedBg === preset.url ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-transparent hover:opacity-80'
                  }`}
                  title={preset.title}
                >
                  <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                  {selectedBg === preset.url && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Gradient row */}
            <div className="grid grid-cols-5 gap-2">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedBg(g.gradient)}
                  style={{ background: g.gradient }}
                  className={`relative h-7 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                    selectedBg === g.gradient ? 'border-white ring-2 ring-white/50 scale-105' : 'border-transparent hover:scale-105'
                  }`}
                  title={g.title}
                >
                  {selectedBg === g.gradient && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Board Title Input */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Board title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint Backlog"
              className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Visibility Selector */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
            >
              <option value="workspace">Workspace — anyone in workspace can view and edit</option>
              <option value="private">Private — only board members can view and edit</option>
              <option value="public">Public — anyone with link can view</option>
            </select>
          </div>

          {/* Submit CTA */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white/70 hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 rounded-lg bg-[#0052cc] hover:bg-blue-600 disabled:opacity-50 text-xs font-bold text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;
