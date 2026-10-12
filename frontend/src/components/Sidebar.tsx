import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  Home,
  Plus,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { Workspace } from '../services/workspaceService';

export type DashboardNavSection = 'boards' | 'templates' | 'home';

export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSection?: DashboardNavSection;
  onSelectSection?: (section: DashboardNavSection) => void;
  onInviteClick?: () => void;
  workspaces?: Workspace[];
  activeWorkspace?: Workspace | null;
  onSelectWorkspace?: (workspace: Workspace) => void;
  onCreateWorkspaceClick?: () => void;
  onWorkspaceSettingsClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activeSection = 'boards',
  onSelectSection,
  onInviteClick,
  workspaces = [],
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspaceClick,
  onWorkspaceSettingsClick,
}) => {
  const activeInitial = activeWorkspace?.name
    ? activeWorkspace.name.trim().slice(0, 2).toUpperCase()
    : 'WS';

  return (
    <aside
      className={`fixed left-0 top-14 bottom-0 z-40 bg-zinc-950/95 border-r border-white/10 text-white flex flex-col justify-between transition-all duration-300 ${
        isOpen ? 'w-60' : 'w-14'
      }`}
    >
      <div className="p-3">
        {/* Workspace banner / collapse toggle */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
          {isOpen ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#0052cc] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
                {activeInitial}
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-white truncate">
                  {activeWorkspace?.name || 'Workspace'}
                </span>
                <span className="block text-[10px] text-white/50 truncate">Enterprise</span>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 mx-auto rounded-lg bg-[#0052cc] text-white font-bold text-xs flex items-center justify-center shadow-sm shadow-blue-500/30">
              {activeInitial}
            </div>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1 mb-6">
          <button
            type="button"
            onClick={() => onSelectSection && onSelectSection('boards')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
              activeSection === 'boards'
                ? 'bg-[#0052cc] text-white shadow-sm'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
            title="Boards"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            {isOpen && <span>Boards</span>}
          </button>

          <button
            type="button"
            onClick={() => onSelectSection && onSelectSection('templates')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
              activeSection === 'templates'
                ? 'bg-[#0052cc] text-white shadow-sm'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
            title="Templates"
          >
            <Kanban className="w-4 h-4 shrink-0" />
            {isOpen && <span>Templates</span>}
          </button>

          <button
            type="button"
            onClick={() => onSelectSection && onSelectSection('home')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
              activeSection === 'home'
                ? 'bg-[#0052cc] text-white shadow-sm'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
            title="Home"
          >
            <Home className="w-4 h-4 shrink-0" />
            {isOpen && <span>Home</span>}
          </button>
        </nav>

        {/* Workspaces list */}
        {isOpen && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Workspaces ({workspaces.length})
              </span>
              <button
                type="button"
                onClick={onCreateWorkspaceClick}
                className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer"
                title="Create new workspace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
              {workspaces && workspaces.length > 0 ? (
                workspaces.map((ws) => {
                  const isActive = activeWorkspace?.id === ws.id;
                  const initials = ws.name.trim().slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => onSelectWorkspace && onSelectWorkspace(ws)}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition text-left ${
                        isActive
                          ? 'bg-[#0052cc]/20 text-white border border-[#0052cc]/40 font-semibold'
                          : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`w-5 h-5 rounded ${
                            isActive ? 'bg-[#0052cc]' : 'bg-zinc-800 border border-white/10'
                          } text-[9px] font-bold text-white flex items-center justify-center shrink-0`}
                        >
                          {initials}
                        </div>
                        <span className="truncate">{ws.name}</span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    </button>
                  );
                })
              ) : (
                <div className="p-2 text-[11px] text-white/40 italic">
                  No workspaces found. Click + to create one.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Settings */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button
          type="button"
          onClick={onInviteClick}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:bg-white/5 hover:text-white transition cursor-pointer"
        >
          <Users className="w-4 h-4 shrink-0" />
          {isOpen && <span>Members & Access</span>}
        </button>

        <button
          type="button"
          onClick={() => {
            if (onWorkspaceSettingsClick) {
              onWorkspaceSettingsClick();
            }
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:bg-white/5 hover:text-white transition cursor-pointer text-left"
        >
          <Settings className="w-4 h-4 shrink-0" />
          {isOpen && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
