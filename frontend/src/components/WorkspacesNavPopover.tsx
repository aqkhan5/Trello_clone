// src/components/WorkspacesNavPopover.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, Plus, X, Check, LayoutGrid } from 'lucide-react';
import { workspaceService, type Workspace } from '../services/workspaceService';

export interface WorkspacesNavPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkspace?: Workspace | null;
  onOpenSettings: () => void;
  onOpenInvite: () => void;
  onOpenCreateWorkspace?: () => void;
}

export const WorkspacesNavPopover: React.FC<WorkspacesNavPopoverProps> = ({
  isOpen,
  onClose,
  currentWorkspace,
  onOpenSettings,
  onOpenInvite,
  onOpenCreateWorkspace,
}) => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    if (isOpen) {
      workspaceService.getAllWorkspaces().then(setWorkspaces).catch(() => []);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 rounded-2xl border border-white/10 bg-[#22272b] p-3.5 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/10">
        <h3 className="text-xs font-semibold text-white/90">Workspaces</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Current Workspace Header */}
      <div className="mb-3">
        <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
          Current Workspace
        </p>
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/10">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-xs text-white shadow">
            {currentWorkspace?.name ? currentWorkspace.name.slice(0, 2).toUpperCase() : 'WS'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">
              {currentWorkspace?.name || 'My Workspace'}
            </div>
            <div className="text-[10px] text-white/50">
              Free • Workspace
            </div>
          </div>
        </div>

        {/* Action Links */}
        <div className="mt-2 space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/dashboard');
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
            <span>Boards</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenInvite();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Members & Invitations</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-purple-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Your Other Workspaces */}
      {workspaces.length > 1 && (
        <div className="pt-2 border-t border-white/10">
          <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
            Your Workspaces
          </p>
          <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1">
            {workspaces.map((ws) => {
              const isSelected = ws.id === currentWorkspace?.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/dashboard');
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-white/15 text-white font-semibold'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-6 w-6 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold">
                      {ws.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs truncate">{ws.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {onOpenCreateWorkspace && (
        <div className="pt-2 mt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreateWorkspace();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-blue-400 hover:bg-white/10 hover:text-blue-300 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Workspace</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkspacesNavPopover;
