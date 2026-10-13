import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Trash2,
  Save,
  Check,
  AlertCircle,
  Loader2,
  Briefcase,
  AlertTriangle,
  Users,
  Search,
  ShieldCheck,
  UserMinus,
} from 'lucide-react';
import {
  workspaceService,
  type Workspace,
  type WorkspaceMember,
} from '../services/workspaceService';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  onWorkspaceUpdated?: (updated: Workspace) => void;
  onWorkspaceDeleted?: (deletedId: string) => void;
}

export const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onWorkspaceUpdated,
  onWorkspaceDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
  const [name, setName] = useState(workspace?.name || '');
  const [description, setDescription] = useState(workspace?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Members state
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || '');
      setDescription(workspace.description || '');
    }
    setConfirmDelete(false);
    setSuccessMsg(null);
    setErrorMsg(null);
  }, [workspace, isOpen]);

  useEffect(() => {
    if (workspace && isOpen) {
      setIsLoadingMembers(true);
      workspaceService
        .getWorkspaceMembers(workspace.id)
        .then((mems) => setMembers(mems || []))
        .catch((err) => console.warn('Failed to load workspace members:', err))
        .finally(() => setIsLoadingMembers(false));
    }
  }, [workspace, isOpen]);

  if (!isOpen || !workspace) return null;

  const handleUpdateMemberRole = async (userId: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      await workspaceService.updateWorkspaceMemberRole(workspace.id, userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
      );
      setSuccessMsg(`Member role updated to ${newRole}`);
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      console.warn('Failed to update member role:', err);
      setErrorMsg(err?.response?.data?.detail || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await workspaceService.removeWorkspaceMember(workspace.id, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      setSuccessMsg('Member removed from workspace');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      console.warn('Failed to remove member:', err);
      setErrorMsg(err?.response?.data?.detail || 'Failed to remove member.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Workspace name cannot be empty');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await workspaceService.updateWorkspace(workspace.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setSuccessMsg('Workspace updated successfully!');
      if (onWorkspaceUpdated) {
        onWorkspaceUpdated(updated);
      }
      setTimeout(() => {
        setSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      console.warn('Failed to update workspace:', err);
      setErrorMsg(
        err?.response?.data?.detail || err?.message || 'Failed to update workspace.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await workspaceService.deleteWorkspace(workspace.id);
      if (onWorkspaceDeleted) {
        onWorkspaceDeleted(workspace.id);
      }
      onClose();
    } catch (err: any) {
      console.warn('Failed to delete workspace:', err);
      setErrorMsg(
        err?.response?.data?.detail || err?.message || 'Failed to delete workspace.'
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl text-white backdrop-blur-xl relative space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Workspace Settings</h2>
              <p className="text-xs text-white/50">Manage workspace name, details, and permissions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2.5 text-xs text-emerald-300">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>General</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'members'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({members.length})</span>
          </button>
        </div>

        {activeTab === 'general' && (
          <>
            {/* Settings Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80">Workspace Name</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Engineering, Marketing, Operations..."
                    required
                    className="w-full h-9 rounded-xl border border-white/15 bg-black/40 pl-9 pr-3 text-xs text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this workspace used for?"
                  rows={3}
                  className="w-full rounded-xl border border-white/15 bg-black/40 p-3 text-xs text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || (name === workspace.name && description === (workspace.description || ''))}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-50 px-4 py-2 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>

            {/* Danger Zone */}
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">Danger Zone</span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Deleting this workspace will permanently remove all associated boards, lists, and cards.
                This action cannot be undone.
              </p>

              <div className="pt-1 flex items-center justify-between">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow transition cursor-pointer"
                    >
                      {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      <span>Yes, Delete Permanently</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete this workspace</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                placeholder="Search workspace members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full h-9 rounded-xl border border-white/15 bg-black/40 pl-9 pr-3 text-xs text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {isLoadingMembers ? (
              <div className="py-10 text-center text-xs text-white/50 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span>Loading workspace members...</span>
              </div>
            ) : members.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/40 italic border border-dashed border-white/10 rounded-xl">
                No members found in this workspace.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {members
                  .filter((m) =>
                    (m.user?.full_name || m.user?.email || '')
                      .toLowerCase()
                      .includes(memberSearch.toLowerCase())
                  )
                  .map((m) => {
                    const isOwner = m.user_id === workspace.owner_id;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 text-xs hover:border-white/20 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                            {(m.user?.full_name || 'M').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-white truncate">
                                {m.user?.full_name || 'Workspace Member'}
                              </p>
                              {isOwner && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  Owner
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-white/50 truncate">{m.user?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isOwner ? (
                            <span className="text-[11px] text-white/40 font-medium px-2 py-1">Admin</span>
                          ) : (
                            <>
                              <select
                                value={m.role}
                                onChange={(e) =>
                                  handleUpdateMemberRole(m.user_id, e.target.value as 'ADMIN' | 'MEMBER')
                                }
                                className="rounded-lg bg-zinc-800 border border-white/15 px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
                              >
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.user_id)}
                                className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                title="Remove member"
                              >
                                <UserMinus className="w-4 h-4" />
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
      </div>
    </div>
  );
};

export default WorkspaceSettingsModal;
