import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Shield,
  Save,
  LogOut,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { authService, type UserResponse } from '../services/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserResponse | null;
  onUserUpdated?: (updated: UserResponse) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
    }
    setSuccessMsg(null);
    setErrorMsg(null);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const initials = fullName
    ? fullName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Full name cannot be empty');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await authService.updateMe({ full_name: fullName.trim() });
      setSuccessMsg('Profile updated successfully!');
      if (onUserUpdated) {
        onUserUpdated(updated);
      }
      setTimeout(() => {
        setSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      console.warn('Failed to update profile:', err);
      setErrorMsg(
        err?.response?.data?.detail || err?.message || 'Failed to update profile.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl text-white backdrop-blur-xl relative space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-emerald-400">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Profile & Visibility</h2>
              <p className="text-xs text-white/50">Manage your personal account details</p>
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

        {/* User Avatar & Basic Info */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 text-zinc-950 flex items-center justify-center font-bold text-xl shadow-lg border border-emerald-400/30">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white truncate">{fullName || 'User'}</h3>
            <p className="text-xs text-white/50 truncate">{user?.email || 'No email attached'}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <Shield className="h-3 w-3" />
              <span>Active Account</span>
            </div>
          </div>
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

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name..."
                required
                className="w-full h-9 rounded-xl border border-white/15 bg-black/40 pl-9 pr-3 text-xs text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full h-9 rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-xs text-white/50 cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-white/40">Email is linked to your account authentication.</p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                authService.logout();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || fullName.trim() === user?.full_name}
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
