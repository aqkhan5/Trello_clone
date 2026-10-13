// src/components/NotificationsPopover.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  X,
  Users,
  CheckCircle2,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { invitationService } from '../services/invitationService';

export interface NotificationItem {
  id: string;
  type: 'invitation' | 'activity' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  token?: string;
  workspaceId?: string;
  workspaceName?: string;
  role?: string;
}

export interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Load notifications from backend invitations + simulated recent activity
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const pendingInvites = await invitationService.getMyPendingInvitations().catch(() => []);

      const inviteNotifications: NotificationItem[] = (pendingInvites || []).map((inv: any) => ({
        id: `invite-${inv.id}`,
        type: 'invitation',
        title: 'Workspace Invitation',
        message: `You have been invited to join "${inv.workspace?.name || 'Workspace'}" as ${inv.role || 'Member'}`,
        time: inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Recently',
        isRead: false,
        token: inv.token,
        workspaceId: inv.workspace?.id,
        workspaceName: inv.workspace?.name,
        role: inv.role,
      }));

      // Base system notification if no invites
      const defaultNotifications: NotificationItem[] = [
        {
          id: 'sys-welcome',
          type: 'system',
          title: 'Welcome to Quasha',
          message: 'Explore your workspaces, create boards, and organize tasks with ease.',
          time: 'Just now',
          isRead: false,
        },
      ];

      // Check localStorage for read status overrides
      const readIds = new Set(JSON.parse(localStorage.getItem('read_notifications') || '[]'));
      const combined = [...inviteNotifications, ...defaultNotifications].map((n) => ({
        ...n,
        isRead: readIds.has(n.id),
      }));

      setNotifications(combined);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Update parent unread count
  useEffect(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    if (onUnreadCountChange) {
      onUnreadCountChange(unread);
    }
  }, [notifications, onUnreadCountChange]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleMarkAsRead = (id: string) => {
    const readIds = new Set(JSON.parse(localStorage.getItem('read_notifications') || '[]'));
    readIds.add(id);
    localStorage.setItem('read_notifications', JSON.stringify(Array.from(readIds)));

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem('read_notifications', JSON.stringify(allIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All notifications marked as read');
  };

  const handleClearAll = () => {
    setNotifications([]);
    showToast('Notifications cleared');
  };

  const handleAcceptInvite = async (token: string, notificationId: string) => {
    setActionLoadingId(notificationId);
    try {
      await invitationService.acceptInvitation(token);
      showToast('Invitation accepted! Welcome to the workspace.');
      handleMarkAsRead(notificationId);
      // Remove invite notification
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      showToast(err?.response?.data?.detail || 'Failed to accept invitation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineInvite = async (token: string, notificationId: string) => {
    setActionLoadingId(notificationId);
    try {
      await invitationService.declineInvitation(token);
      showToast('Invitation declined');
      handleMarkAsRead(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err: any) {
      console.error('Failed to decline invitation:', err);
      showToast(err?.response?.data?.detail || 'Failed to decline invitation');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.isRead : true
  );
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 sm:right-2 top-11 z-50 w-84 sm:w-96 rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl text-white backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[500px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-[11px] text-emerald-400 hover:text-white transition cursor-pointer"
            >
              Mark all as read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating feedback toast */}
      {toastMsg && (
        <div className="mx-3 mt-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5 shadow-md">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{toastMsg}</span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/20 text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              filter === 'all'
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              filter === 'unread'
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[10px] text-white/40 hover:text-rose-400 transition cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-white/50 flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Loading notifications...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center space-y-1 text-white/50">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-1" />
            <p className="text-xs font-semibold text-white/80">All caught up!</p>
            <p className="text-[11px] text-white/40">No new notifications to show.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-xl border transition ${
                n.isRead
                  ? 'bg-white/5 border-white/5 text-white/70'
                  : 'bg-white/10 border-blue-500/30 text-white shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type === 'invitation'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {n.type === 'invitation' ? (
                      <Users className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-white/40 mt-1 inline-block">{n.time}</span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(n.id)}
                    title="Mark as read"
                    className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action buttons for workspace invitations */}
              {n.type === 'invitation' && n.token && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    disabled={actionLoadingId === n.id}
                    onClick={() => handleAcceptInvite(n.token!, n.id)}
                    className="flex-1 py-1 px-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-zinc-950 text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {actionLoadingId === n.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    <span>Accept</span>
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingId === n.id}
                    onClick={() => handleDeclineInvite(n.token!, n.id)}
                    className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 bg-black/40 text-center shrink-0">
        <span className="text-[10px] text-white/40">In-App Notification Engine v2.5</span>
      </div>
    </div>
  );
};

export default NotificationsPopover;
