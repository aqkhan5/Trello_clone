import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  UserPlus,
  Mail,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';
import invitationService, {
  type WorkspaceInvitationItem,
} from '../services/invitationService';

export interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  workspaceName?: string;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  workspaceName = 'Workspace',
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [copied, setCopied] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<WorkspaceInvitationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch pending invitations from backend on open
  useEffect(() => {
    if (!isOpen || !workspaceId) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    invitationService
      .getWorkspaceInvitations(workspaceId)
      .then((invites) => {
        if (isMounted) {
          // Keep active pending invitations
          const activePending = (invites || []).filter(
            (inv) => inv.status === 'PENDING'
          );
          setPendingInvitations(activePending);
        }
      })
      .catch((err) => {
        console.warn('Failed to load workspace invitations:', err);
        // Silently tolerate if non-admin or error
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, workspaceId]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    // If there's an active pending invite, copy the accept link for the most recent one
    let linkToCopy = window.location.href;
    if (pendingInvitations.length > 0 && pendingInvitations[0]?.token) {
      linkToCopy = `${window.location.origin}/invitations/accept?token=${pendingInvitations[0].token}`;
    }
    navigator.clipboard.writeText(linkToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    if (!workspaceId) {
      setErrorMessage(
        'Cannot send invitation: Workspace ID is not specified. Please access this board through a workspace.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const createdInvite = await invitationService.inviteMember(workspaceId, {
        email: trimmedEmail,
        role: role === 'admin' ? 'ADMIN' : 'MEMBER',
      });

      setPendingInvitations((prev) => [createdInvite, ...prev]);
      setSuccessMessage(
        `Invitation sent successfully to ${trimmedEmail}! Transactional email has been dispatched.`
      );
      setEmail('');
    } catch (err: any) {
      console.error('Failed to send workspace invitation:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to dispatch workspace invitation. Please verify the email and try again.';
      setErrorMessage(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!workspaceId) return;

    try {
      await invitationService.revokeInvitation(workspaceId, invitationId);
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      setSuccessMessage('Invitation has been revoked.');
    } catch (err: any) {
      console.warn('Failed to revoke invitation on backend:', err);
      // Remove locally regardless
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    }
  };

  const getInitials = (invEmail: string) => {
    const parts = invEmail.split('@')[0].split('.');
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : invEmail.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-zinc-900 text-white rounded-2xl border border-white/10 shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0052cc] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Invite to {workspaceName}
              </h2>
              <p className="text-xs text-white/50">
                Collaborate on boards and lists across this workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Invitation Error</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Success</span>
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Invite by email form */}
        <form onSubmit={handleSendInvite} className="space-y-3 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                disabled={isSubmitting}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition disabled:opacity-60"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
              disabled={isSubmitting}
              className="h-10 px-3 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500 transition cursor-pointer disabled:opacity-60"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-lg bg-[#0052cc] hover:bg-blue-600 disabled:opacity-50 text-xs font-bold text-white shadow-md transition cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Invite</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Share with link card */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 mb-6">
          <div>
            <span className="block text-xs font-semibold text-white">Invite with a link</span>
            <span className="block text-[11px] text-white/50">
              Anyone with this link can join as a Member
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition cursor-pointer shrink-0 active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>

        {/* Pending invitations list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">
              Pending Invitations ({pendingInvitations.length})
            </span>
            {isLoading && (
              <div className="flex items-center gap-1 text-[11px] text-white/40">
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                <span>Syncing...</span>
              </div>
            )}
          </div>
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {isLoading && pendingInvitations.length === 0 ? (
              <div className="py-6 text-center text-xs text-white/40 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span>Loading workspace invitations...</span>
              </div>
            ) : pendingInvitations.length === 0 ? (
              <p className="text-xs text-white/40 italic py-4 text-center border border-dashed border-white/10 rounded-xl">
                No pending invitations.
              </p>
            ) : (
              pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/70 border border-white/5 text-xs hover:border-white/15 transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#0052cc]/30 text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0 border border-blue-500/20">
                      {getInitials(inv.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{inv.email}</p>
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <span className="capitalize">{inv.role?.toLowerCase() || 'Member'}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRevoke(inv.id)}
                      className="p-1.5 rounded-md text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Revoke invitation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMembersModal;
