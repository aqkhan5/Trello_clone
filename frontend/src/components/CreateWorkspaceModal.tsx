import React, { useState } from 'react';
import { X, Briefcase, Loader2, AlertCircle } from 'lucide-react';

export interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace: (data: { name: string; description?: string }) => Promise<void>;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreateWorkspace,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Workspace name is required.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    try {
      await onCreateWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.detail || err?.message || 'Failed to create workspace on server.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-900 text-white rounded-2xl border border-white/10 shadow-2xl p-6 overflow-hidden space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 text-zinc-950 flex items-center justify-center shadow-md shadow-emerald-500/20 font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Create a Workspace</h2>
              <p className="text-[11px] text-white/50">
                A workspace houses your boards, team members, and projects.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-white/90">
              Workspace Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering & Platform, Operations..."
              autoFocus
              className="w-full px-3 py-2 rounded-xl bg-zinc-800/90 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-white/90">
              Description <span className="text-white/40 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Our team's sprints, roadmap, and cross-functional boards..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-zinc-800/90 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-50 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? 'Creating...' : 'Create Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
