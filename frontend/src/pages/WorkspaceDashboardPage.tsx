import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Star,
  Clock,
  LayoutGrid,
  List,
  Sparkles,
  Users,
  Settings,
  ShieldCheck,
  ArrowRight,
  Workflow,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
  X as CloseIcon,
  Briefcase,
  Calendar,
  CheckSquare,
  Rocket,
  Bug,
  ArrowUpRight,
  Check,
  Kanban,
  Home,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar, { type DashboardNavSection } from '../components/Sidebar';
import CreateBoardModal from '../components/CreateBoardModal';
import InviteMembersModal from '../components/InviteMembersModal';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';
import ProfileModal from '../components/ProfileModal';
import WorkspaceSettingsModal from '../components/WorkspaceSettingsModal';
import TemplatePreviewModal, { TEMPLATES } from '../components/TemplatePreviewModal';
import { authService, type UserResponse } from '../services/auth';
import { workspaceService, type Workspace } from '../services/workspaceService';
import { boardService } from '../services/boardService';
import {
  isBoardStarred,
  toggleStarBoard,
  recordRecentBoard,
  onBoardNavChange,
  getRecentBoards,
  type BoardNavItem,
} from '../services/boardNavService';

export interface BoardItem {
  id: string;
  title: string;
  background: string;
  tags?: string[];
  membersCount: number;
  lastActive: string;
  isStarred?: boolean;
  listsCount?: number;
}

export interface HomeTaskItem {
  id: string;
  title: string;
  boardTitle: string;
  boardId?: string;
  dueDateText: string;
  isCompleted: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const BG_PRESETS = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
];

export const WorkspaceDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardSection, setDashboardSection] = useState<DashboardNavSection>('boards');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('all');
  const [recentBoardsList, setRecentBoardsList] = useState<BoardNavItem[]>([]);
  const [homeTaskFilter, setHomeTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [homeTasks, setHomeTasks] = useState<HomeTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('quasha_home_tasks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'task-1',
        title: 'Review PR: User Authentication & OAuth2 Flow',
        boardTitle: 'Sprint Backlog',
        dueDateText: 'Due today',
        isCompleted: false,
        priority: 'high',
      },
      {
        id: 'task-2',
        title: 'Verify Redis token bucket rate limiting on /api/v1',
        boardTitle: 'Engineering & Operations',
        dueDateText: 'Due tomorrow',
        isCompleted: false,
        priority: 'high',
      },
      {
        id: 'task-3',
        title: 'Run blameless post-mortem retrospective for INC-201',
        boardTitle: 'DevOps Post-Mortems',
        dueDateText: 'Due in 2 days',
        isCompleted: false,
        priority: 'medium',
      },
      {
        id: 'task-4',
        title: 'Dark mode contrast verification across card modal',
        boardTitle: 'Quality Assurance',
        dueDateText: 'Due Friday',
        isCompleted: true,
        priority: 'low',
      },
    ];
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('kanban-wip');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWorkspaceSettingsModalOpen, setIsWorkspaceSettingsModalOpen] = useState(false);
  const [isEditingWorkspaceName, setIsEditingWorkspaceName] = useState(false);
  const [workspaceNameInput, setWorkspaceNameInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Backend state
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [boards, setBoards] = useState<BoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRenameWorkspace = async (newName: string) => {
    setIsEditingWorkspaceName(false);
    const trimmed = newName.trim();
    if (!trimmed || !activeWorkspace || trimmed === activeWorkspace.name) return;

    const updatedWs = { ...activeWorkspace, name: trimmed };
    setActiveWorkspace(updatedWs);
    setWorkspaces((prev) => prev.map((ws) => (ws.id === activeWorkspace.id ? updatedWs : ws)));

    try {
      await workspaceService.updateWorkspace(activeWorkspace.id, { name: trimmed });
    } catch (err: any) {
      console.warn('Failed to update workspace name:', err);
      loadData();
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch current user
      try {
        const me = await authService.getMe();
        setCurrentUser(me);
      } catch {
        // Interceptor will redirect to login if 401
      }

      // 2. Fetch all real workspaces for this user
      let wsList: Workspace[] = [];
      try {
        wsList = await workspaceService.getAllWorkspaces();
      } catch (wsErr: any) {
        console.warn('Could not fetch workspaces:', wsErr);
      }

      setWorkspaces(wsList);
      const currentWs = wsList.length > 0 ? wsList[0] : null;
      setActiveWorkspace(currentWs);

      // 3. Fetch boards for the active workspace
      if (currentWs) {
        try {
          const backendBoards = await boardService.getBoards(currentWs.id);
          const mapped: BoardItem[] = backendBoards.map((b, idx) => ({
            id: b.id,
            title: b.title,
            background: b.background || BG_PRESETS[idx % BG_PRESETS.length],
            tags: [b.visibility || 'Workspace'],
            membersCount: 1,
            lastActive: 'Active recently',
            isStarred: isBoardStarred(b.id),
            listsCount: 0,
          }));
          setBoards(mapped);
        } catch (bErr) {
          console.warn('Could not fetch boards for workspace:', bErr);
          setBoards([]);
        }
      } else {
        setBoards([]);
      }
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.detail || err?.message || 'Failed to connect to backend server.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setRecentBoardsList(getRecentBoards());
    const cleanup = onBoardNavChange(() => {
      setBoards((prev) =>
        prev.map((b) => ({ ...b, isStarred: isBoardStarred(b.id) }))
      );
      setRecentBoardsList(getRecentBoards());
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const sec = searchParams.get('section');
    if (sec === 'templates' || sec === 'home' || sec === 'boards') {
      setDashboardSection(sec as DashboardNavSection);
    }
  }, [searchParams]);

  const handleSelectSection = (section: DashboardNavSection) => {
    setDashboardSection(section);
    if (section === 'boards') {
      searchParams.delete('section');
      setSearchParams(searchParams, { replace: true });
    } else {
      searchParams.set('section', section);
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleToggleHomeTask = (taskId: string) => {
    setHomeTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
      );
      try {
        localStorage.setItem('quasha_home_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddHomeTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: HomeTaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskInput.trim(),
      boardTitle: activeWorkspace?.name || 'General',
      dueDateText: 'Due soon',
      isCompleted: false,
      priority: 'medium',
    };
    setHomeTasks((prev) => {
      const updated = [newTask, ...prev];
      try {
        localStorage.setItem('quasha_home_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setNewTaskInput('');
  };

  const handleSelectWorkspace = async (ws: Workspace) => {
    setActiveWorkspace(ws);
    setIsLoading(true);
    try {
      const backendBoards = await boardService.getBoards(ws.id);
      const mapped: BoardItem[] = backendBoards.map((b, idx) => ({
        id: b.id,
        title: b.title,
        background: b.background || BG_PRESETS[idx % BG_PRESETS.length],
        tags: [b.visibility || 'Workspace'],
        membersCount: 1,
        lastActive: 'Active recently',
        isStarred: isBoardStarred(b.id),
        listsCount: 0,
      }));
      setBoards(mapped);
    } catch (err: any) {
      console.warn('Failed to fetch boards for workspace:', err);
      setBoards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async (data: { name: string; description?: string }) => {
    const created = await workspaceService.createWorkspace(data);
    setWorkspaces((prev) => [created, ...prev]);
    setActiveWorkspace(created);
    setBoards([]);
  };

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const targetBoard = boards.find((b) => b.id === id);
    if (targetBoard) {
      toggleStarBoard({
        id: targetBoard.id,
        title: targetBoard.title,
        workspaceId: activeWorkspace?.id,
        workspaceName: activeWorkspace?.name || 'Workspace',
        background: targetBoard.background,
      });
    }
    setBoards((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isStarred: !b.isStarred } : b))
    );
  };

  const handleOpenBoard = (board: BoardItem) => {
    recordRecentBoard({
      id: board.id,
      title: board.title,
      workspaceId: activeWorkspace?.id,
      workspaceName: activeWorkspace?.name || 'Workspace',
      background: board.background,
    });
    navigate(`/board/${board.id}`);
  };

  const handleCreateBoard = async (newBoard: { title: string; background: string; visibility: string }) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      let targetWsId = activeWorkspace?.id;
      if (!targetWsId) {
        // Create initial workspace if none existed
        const newWs = await workspaceService.createWorkspace({
          name: 'My Workspace',
          description: 'Team workspace for boards',
        });
        setWorkspaces((prev) => [newWs, ...prev]);
        setActiveWorkspace(newWs);
        targetWsId = newWs.id;
      }

      const created = await boardService.createBoard({
        title: newBoard.title,
        workspace_id: targetWsId,
        background: newBoard.background,
        visibility: newBoard.visibility,
      });

      const item: BoardItem = {
        id: created.id,
        title: created.title,
        background: newBoard.background || BG_PRESETS[0],
        tags: [created.visibility || 'Workspace'],
        membersCount: 1,
        lastActive: 'Just now',
        isStarred: false,
        listsCount: 0,
      };

      recordRecentBoard({
        id: created.id,
        title: created.title,
        workspaceId: targetWsId,
        workspaceName: activeWorkspace?.name || 'Workspace',
        background: newBoard.background,
      });

      setBoards((prev) => [item, ...prev]);
      setIsCreateModalOpen(false);
      navigate(`/board/${created.id}`);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.detail || err?.message || 'Failed to create board on server. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsTemplateModalOpen(true);
  };

  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const starredBoards = filteredBoards.filter((b) => b.isStarred);

  const TEMPLATE_CATEGORIES = [
    { id: 'all', label: 'All Templates' },
    { id: 'Engineering & Operations', label: 'Engineering & Operations' },
    { id: 'Agile Development', label: 'Agile Development' },
    { id: 'Incident Management', label: 'Incident Management' },
    { id: 'Quality Assurance', label: 'Quality Assurance' },
    { id: 'Product Management', label: 'Product Management' },
  ];

  const filteredTemplates = TEMPLATES.filter((tpl) => {
    const matchesCategory =
      selectedTemplateCategory === 'all' || tpl.category === selectedTemplateCategory;
    const matchesSearch =
      tpl.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      tpl.subtitle.toLowerCase().includes(templateSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderTemplateIcon = (iconType: string) => {
    switch (iconType) {
      case 'workflow':
        return <Workflow className="w-5 h-5 text-emerald-400" />;
      case 'rotate':
        return <RotateCcw className="w-5 h-5 text-emerald-400" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'bug':
        return <Bug className="w-5 h-5 text-purple-400" />;
      case 'rocket':
        return <Rocket className="w-5 h-5 text-cyan-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-white select-none">
      {/* Top Navbar */}
      <Navbar
        onMobileMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onCreateClick={() => setIsCreateModalOpen(true)}
        userName={currentUser?.full_name || 'User'}
        userEmail={currentUser?.email || ''}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspaceClick={() => setIsCreateWorkspaceModalOpen(true)}
        onProfileClick={() => setIsProfileModalOpen(true)}
        onSettingsClick={() => setIsProfileModalOpen(true)}
        onWorkspaceSettingsClick={() => setIsWorkspaceSettingsModalOpen(true)}
      />

      {/* Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeSection={dashboardSection}
        onSelectSection={handleSelectSection}
        onInviteClick={() => setIsInviteModalOpen(true)}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspaceClick={() => setIsCreateWorkspaceModalOpen(true)}
        onWorkspaceSettingsClick={() => setIsWorkspaceSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 pt-14 ${isSidebarOpen ? 'md:pl-60' : 'md:pl-14'}`}>
        <main className="relative min-h-[calc(100vh-3.5rem)] p-4 sm:p-8 bg-zinc-950 overflow-x-hidden">
          <div className="relative z-10 max-w-7xl mx-auto space-y-6">
            {/* Error / Alert Banner */}
            {errorMessage && (
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs backdrop-blur-md shadow-lg animate-in fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="truncate">{errorMessage}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={loadData}
                    className="px-2.5 py-1 rounded-md bg-rose-500/30 hover:bg-rose-500/40 text-white font-medium transition cursor-pointer"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="p-1 text-rose-300 hover:text-white transition cursor-pointer"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 1: BOARDS VIEW                                   */}
            {/* ======================================================== */}
            {dashboardSection === 'boards' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Top Workspace Banner */}
                <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-zinc-950 font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
                    {activeWorkspace?.name
                      ? activeWorkspace.name.trim().slice(0, 2).toUpperCase()
                      : 'WS'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isEditingWorkspaceName ? (
                        <input
                          type="text"
                          value={workspaceNameInput}
                          onChange={(e) => setWorkspaceNameInput(e.target.value)}
                          onBlur={() => handleRenameWorkspace(workspaceNameInput)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameWorkspace(workspaceNameInput);
                            if (e.key === 'Escape') setIsEditingWorkspaceName(false);
                          }}
                          autoFocus
                          className="h-9 rounded-xl border border-emerald-500 bg-zinc-950/90 px-3 text-xl font-bold text-white focus:outline-none shadow-lg"
                        />
                      ) : (
                        <h1
                          onClick={() => {
                            if (activeWorkspace) {
                              setIsEditingWorkspaceName(true);
                              setWorkspaceNameInput(activeWorkspace.name);
                            }
                          }}
                          className="text-2xl font-bold tracking-tight text-white cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded-lg transition"
                          title="Click to rename workspace"
                        >
                          {activeWorkspace?.name || 'No Workspace Selected'}
                        </h1>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Team</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[11px] font-medium backdrop-blur-sm">
                        Enterprise
                      </span>
                    </div>
                    <p className="text-xs text-white/60 max-w-2xl">
                      {activeWorkspace?.description ||
                        'Create and organize your boards, collaborate with team members, and track development velocity.'}
                    </p>
                  </div>
                </div>

                {/* Workspace Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateWorkspaceModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>New Workspace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Invite Members</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Board</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWorkspaceSettingsModalOpen(true)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                    title="Workspace Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Metric Cards Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/5">
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Active Boards</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{boards.length}</span>
                    <span className="text-[11px] text-emerald-400 font-medium">In Workspace</span>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Team Members</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">1</span>
                    <span className="text-[11px] text-white/50">Owner</span>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Your Workspaces</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{workspaces.length}</span>
                    <span className="text-[11px] text-emerald-400 font-medium">Synced</span>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Connected Gateway</span>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="flex items-center gap-1.5 text-xs text-white font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      FastAPI Backend
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation & Filters Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/80 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleSelectSection('boards')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer bg-gradient-to-r from-emerald-500 to-green-500 text-zinc-950 shadow-sm shadow-emerald-500/20"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Boards</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                    {filteredBoards.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSection('templates')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Templates</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10">
                    {TEMPLATES.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSection('home')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Members</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateWorkspaceModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Workspace</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter boards by title..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-white/10 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>

                <div className="flex items-center rounded-lg bg-white/10 p-0.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded-md transition cursor-pointer ${
                      viewMode === 'grid' ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm' : 'text-white/60 hover:text-white'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1 rounded-md transition cursor-pointer ${
                      viewMode === 'table' ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm' : 'text-white/60 hover:text-white'
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading Skeleton */}
            {isLoading && boards.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-44 rounded-2xl bg-zinc-900/60 border border-white/10 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-16 bg-white/10 rounded" />
                      <div className="h-4 w-4 bg-white/10 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-white/10 rounded" />
                      <div className="h-3 w-1/2 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Starred Boards Section */}
            {starredBoards.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  <h2 className="text-sm font-bold text-white tracking-tight">Starred Boards</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {starredBoards.map((board) => (
                    <div
                      key={board.id}
                      onClick={() => handleOpenBoard(board)}
                      className="group relative rounded-2xl overflow-hidden bg-zinc-900/85 backdrop-blur-md border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between h-44"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url('${board.background}')` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/40" />

                      <div className="relative z-10 p-4 flex items-start justify-between">
                        <div className="flex flex-wrap gap-1.5">
                          {board.tags?.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-emerald-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider shadow-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleStar(e, board.id)}
                          className="text-amber-400 hover:scale-110 transition cursor-pointer"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      <div className="relative z-10 p-4 space-y-2">
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
                          {board.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <div className="flex items-center -space-x-1.5">
                            {Array.from({ length: Math.min(board.membersCount, 3) }).map((_, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full bg-emerald-600 text-zinc-950 text-[9px] font-bold flex items-center justify-center ring-2 ring-zinc-900"
                              >
                                {i === 0 ? 'AM' : i === 1 ? 'SK' : '+'}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span>{board.lastActive}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Your Boards Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white tracking-tight">Your Boards</h2>
                </div>
                <span className="text-xs text-white/50">
                  Showing {filteredBoards.length} of {boards.length} boards
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Create New Board Card */}
                <div
                  onClick={() => setIsCreateModalOpen(true)}
                  className="group relative rounded-2xl p-6 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-dashed border-white/20 hover:border-emerald-400 flex flex-col items-center justify-center text-center gap-3 h-44 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500 text-emerald-400 group-hover:text-zinc-950 flex items-center justify-center shadow-inner transition">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white group-hover:text-emerald-400 transition">
                      Create new board
                    </span>
                    <span className="text-[11px] text-white/40">Synced with backend</span>
                  </div>
                </div>

                {/* Board Cards */}
                {filteredBoards.map((board) => (
                  <div
                    key={board.id}
                    onClick={() => handleOpenBoard(board)}
                    className="group relative rounded-2xl overflow-hidden bg-zinc-900/85 backdrop-blur-md border border-white/10 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between h-44"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url('${board.background}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-black/30" />

                    <div className="relative z-10 p-3 flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded bg-white/15 backdrop-blur-md text-white text-[10px] font-semibold">
                        {board.listsCount ? `${board.listsCount} lists` : 'Board'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleStar(e, board.id)}
                        className="text-white/40 hover:text-amber-400 transition cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${board.isStarred ? 'text-amber-400 fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="relative z-10 p-3 space-y-1.5">
                      <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition line-clamp-1">
                        {board.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-white/40">
                        <span>{board.membersCount} members</span>
                        <span>{board.lastActive}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Template Shortcuts */}
            <div className="bg-zinc-900/70 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">
                    Get started quickly with proven engineering templates
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectSection('templates')}
                  className="text-xs text-emerald-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Explore templates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => handleOpenTemplate('kanban-wip')}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition flex items-center gap-3 group"
                >
                  <Workflow className="w-5 h-5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                      Kanban with WIP Limits
                    </p>
                    <p className="text-[10px] text-white/50 truncate">Strict flow controls for platform teams</p>
                  </div>
                </div>

                <div
                  onClick={() => handleOpenTemplate('scrum-sprints')}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition flex items-center gap-3 group"
                >
                  <RotateCcw className="w-5 h-5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                      Bi-Weekly Scrum Sprints
                    </p>
                    <p className="text-[10px] text-white/50 truncate">Backlog grooming, sprints & retros</p>
                  </div>
                </div>

                <div
                  onClick={() => handleOpenTemplate('devops-postmortem')}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition flex items-center gap-3 group"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      DevOps Post-Mortems
                    </p>
                    <p className="text-[10px] text-white/50 truncate">Incident timelines & action trackers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

            {/* ======================================================== */}
            {/* SECTION 2: TEMPLATES GALLERY VIEW                        */}
            {/* ======================================================== */}
            {dashboardSection === 'templates' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header Banner */}
                <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Pre-built Engineering Workflows</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        Quasha Template Gallery
                      </h1>
                      <p className="text-xs sm:text-sm text-white/60 max-w-2xl leading-relaxed">
                        Kickstart your team's workflow with proven, pre-configured boards.
                        Every template includes realistic lists, production-ready cards, and industry-standard workflows.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectSection('boards')}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2"
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>My Boards</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Blank Board</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Navigation Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/80 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => handleSelectSection('boards')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Boards</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
                        {filteredBoards.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSection('templates')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer bg-gradient-to-r from-emerald-500 to-green-500 text-zinc-950 shadow-sm shadow-emerald-500/20"
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      <span>Templates</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                        {TEMPLATES.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSection('home')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Home</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Members</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreateWorkspaceModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Workspace</span>
                    </button>
                  </div>

                  {/* Search bar */}
                  <div className="relative w-full md:w-72 shrink-0">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    <input
                      type="text"
                      value={templateSearchQuery}
                      onChange={(e) => setTemplateSearchQuery(e.target.value)}
                      placeholder="Search templates..."
                      className="w-full h-8 pl-8 pr-8 rounded-lg bg-white/10 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition"
                    />
                    {templateSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTemplateSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 cursor-pointer"
                      >
                        <CloseIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Pills Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {TEMPLATE_CATEGORIES.map((cat) => {
                    const count =
                      cat.id === 'all'
                        ? TEMPLATES.length
                        : TEMPLATES.filter((t) => t.category === cat.id).length;
                    const isActive = selectedTemplateCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedTemplateCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                            : 'bg-zinc-900/80 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Templates Grid */}
                {filteredTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTemplates.map((template) => {
                      const totalCards = template.lists.reduce((sum, l) => sum + l.cards.length, 0);
                      return (
                        <div
                          key={template.id}
                          className="bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 hover:border-white/25 rounded-2xl overflow-hidden transition duration-200 flex flex-col group shadow-xl hover:shadow-2xl"
                        >
                          {/* Banner Header */}
                          <div
                            className="h-28 p-4 flex flex-col justify-between relative overflow-hidden"
                            style={{ background: template.background }}
                          >
                            <div className="flex items-center justify-between z-10">
                              <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide border border-white/10">
                                {template.category}
                              </span>
                              <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow">
                                {renderTemplateIcon(template.iconType)}
                              </div>
                            </div>
                            <div className="z-10">
                              <span className="text-[11px] text-white/80 font-medium line-clamp-1">
                                {template.subtitle}
                              </span>
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                                {template.title}
                              </h3>
                              <p className="text-xs text-white/60 line-clamp-3 leading-relaxed">
                                {template.description}
                              </p>
                            </div>

                            {/* Included Lists Badges */}
                            <div className="space-y-1.5 pt-2 border-t border-white/5">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                                Included Lists ({template.lists.length})
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {template.lists.map((l, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md bg-white/5 text-white/70 text-[11px] border border-white/5 font-medium"
                                  >
                                    {l.title}
                                    <span className="ml-1 text-[9px] text-white/40">
                                      ({l.cards.length})
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Card Actions Footer */}
                            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                              <span className="text-[11px] text-white/40 font-medium">
                                {totalCards} starter cards
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenTemplate(template.id)}
                                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white text-xs font-semibold transition cursor-pointer"
                                >
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenTemplate(template.id)}
                                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Use Template</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-zinc-900/50 rounded-2xl p-12 text-center border border-white/5 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 text-white/40 flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">No templates found</h3>
                    <p className="text-xs text-white/50 max-w-sm mx-auto">
                      No templates match "{templateSearchQuery}". Try adjusting your search term or select another category.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateSearchQuery('');
                        setSelectedTemplateCategory('all');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 3: HOME COMMAND CENTER VIEW                      */}
            {/* ======================================================== */}
            {dashboardSection === 'home' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Welcoming Banner */}
                <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-zinc-950 font-extrabold text-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
                        {currentUser?.full_name ? currentUser.full_name.slice(0, 2).toUpperCase() : 'ME'}
                      </div>
                      <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                          Welcome back, {currentUser?.full_name || 'User'} 👋
                        </h1>
                        <p className="text-xs text-white/60">
                          Workspace: {activeWorkspace?.name || 'Workspace'} · {boards.length} Boards · Enterprise Edition
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSelectSection('boards')}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2"
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>All Boards ({boards.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Board</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Navigation Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/80 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => handleSelectSection('boards')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Boards</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
                        {filteredBoards.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSection('templates')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      <span>Templates</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
                        {TEMPLATES.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSection('home')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer bg-gradient-to-r from-emerald-500 to-green-500 text-zinc-950 shadow-sm shadow-emerald-500/20"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Home</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Members</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreateWorkspaceModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Workspace</span>
                    </button>
                  </div>
                </div>

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Columns: Up Next & Activity */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Up Next & Due Soon Section */}
                    <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-white">Up Next & Due Soon</h2>
                            <p className="text-[11px] text-white/50">
                              Cards assigned to you or due in upcoming sprints
                            </p>
                          </div>
                        </div>

                        {/* Task filter tabs */}
                        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                          <button
                            type="button"
                            onClick={() => setHomeTaskFilter('all')}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                              homeTaskFilter === 'all'
                                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-xs'
                                : 'text-white/60 hover:text-white'
                            }`}
                          >
                            All ({homeTasks.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setHomeTaskFilter('pending')}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                              homeTaskFilter === 'pending'
                                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-xs'
                                : 'text-white/60 hover:text-white'
                            }`}
                          >
                            Pending ({homeTasks.filter((t) => !t.isCompleted).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setHomeTaskFilter('completed')}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                              homeTaskFilter === 'completed'
                                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-xs'
                                : 'text-white/60 hover:text-white'
                            }`}
                          >
                            Completed ({homeTasks.filter((t) => t.isCompleted).length})
                          </button>
                        </div>
                      </div>

                      {/* Progress summary bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-white/60">
                            {homeTasks.filter((t) => t.isCompleted).length} of {homeTasks.length} tasks completed
                          </span>
                          <span className="font-semibold text-emerald-400">
                            {homeTasks.length > 0
                              ? Math.round(
                                  (homeTasks.filter((t) => t.isCompleted).length / homeTasks.length) * 100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                homeTasks.length > 0
                                  ? (homeTasks.filter((t) => t.isCompleted).length / homeTasks.length) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Task Items List */}
                      <div className="space-y-2">
                        {homeTasks
                          .filter((task) => {
                            if (homeTaskFilter === 'pending') return !task.isCompleted;
                            if (homeTaskFilter === 'completed') return task.isCompleted;
                            return true;
                          })
                          .map((task) => (
                            <div
                              key={task.id}
                              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition group ${
                                task.isCompleted
                                  ? 'bg-white/[0.02] border-white/5 opacity-60'
                                  : 'bg-white/5 hover:bg-white/[0.08] border-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleHomeTask(task.id)}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 ${
                                    task.isCompleted
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-white/30 hover:border-emerald-400 text-transparent hover:text-white/40'
                                  }`}
                                  title={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                                <div className="min-w-0">
                                  <p
                                    className={`text-xs font-medium truncate ${
                                      task.isCompleted
                                        ? 'line-through text-white/50'
                                        : 'text-white group-hover:text-emerald-400'
                                    }`}
                                  >
                                    {task.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-white/40 truncate">
                                      {task.boardTitle}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                    task.isCompleted
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : task.dueDateText.includes('today')
                                      ? 'bg-rose-500/15 text-rose-300'
                                      : 'bg-amber-500/15 text-amber-300'
                                  }`}
                                >
                                  <Calendar className="w-3 h-3" />
                                  <span>{task.isCompleted ? 'Completed' : task.dueDateText}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Quick Add Task Form */}
                      <form onSubmit={handleAddHomeTask} className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={newTaskInput}
                          onChange={(e) => setNewTaskInput(e.target.value)}
                          placeholder="Add a new quick task to Up Next..."
                          className="flex-1 h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition"
                        />
                        <button
                          type="submit"
                          disabled={!newTaskInput.trim()}
                          className="px-3.5 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-40 text-zinc-950 text-xs font-bold shadow-sm shadow-emerald-500/20 transition cursor-pointer shrink-0 flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Task</span>
                        </button>
                      </form>
                    </div>

                    {/* Recent Workspace Activity Stream */}
                    <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-emerald-400 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-white">Recent Activity Stream</h2>
                            <p className="text-[11px] text-white/50">
                              Real-time timeline across boards and team collaborations
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {boards.length > 0 ? (
                          boards.slice(0, 4).map((b, idx) => (
                            <div
                              key={b.id}
                              onClick={() => handleOpenBoard(b)}
                              className="p-3 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/5 transition flex items-center justify-between gap-3 cursor-pointer group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold shadow"
                                  style={{
                                    backgroundImage: b.background.startsWith('http')
                                      ? `url(${b.background})`
                                      : undefined,
                                    background: !b.background.startsWith('http')
                                      ? b.background
                                      : undefined,
                                    backgroundSize: 'cover',
                                  }}
                                >
                                  {!b.background.startsWith('http') && b.title.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-white group-hover:text-emerald-400 truncate">
                                    Active board: <span className="font-bold">{b.title}</span>
                                  </p>
                                  <p className="text-[10px] text-white/40">
                                    {idx === 0 ? 'Recently updated · 1 member' : 'Synced with FastAPI gateway'}
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition" />
                            </div>
                          ))
                        ) : (
                          <div className="p-4 rounded-xl bg-white/5 text-center text-xs text-white/50">
                            No recent board activity yet. Create your first board to start tracking activity!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right 1 Column: Recently Viewed Boards & Shortcuts */}
                  <div className="space-y-6">
                    {/* Recently Viewed Boards */}
                    <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-white/50" />
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                            Recently Viewed
                          </h3>
                        </div>
                        <span className="text-[10px] text-white/40">
                          {recentBoardsList.length} items
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {recentBoardsList.length > 0 ? (
                          recentBoardsList.slice(0, 5).map((board) => (
                            <div
                              key={board.id}
                              onClick={() => navigate(`/board/${board.id}`)}
                              className="p-2 rounded-xl hover:bg-white/10 transition cursor-pointer flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-7 h-7 rounded-lg shrink-0 bg-emerald-600 text-zinc-950 font-bold text-[11px] flex items-center justify-center shadow"
                                  style={{
                                    backgroundImage: board.background?.startsWith('http')
                                      ? `url(${board.background})`
                                      : undefined,
                                    background:
                                      board.background && !board.background.startsWith('http')
                                        ? board.background
                                        : undefined,
                                    backgroundSize: 'cover',
                                  }}
                                >
                                  {!board.background?.startsWith('http') &&
                                    board.title.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-white group-hover:text-emerald-400 truncate">
                                    {board.title}
                                  </p>
                                  <p className="text-[10px] text-white/40 truncate">
                                    {board.workspaceName || 'Workspace'}
                                  </p>
                                </div>
                              </div>
                              <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white transition" />
                            </div>
                          ))
                        ) : boards.length > 0 ? (
                          boards.slice(0, 4).map((b) => (
                            <div
                              key={b.id}
                              onClick={() => handleOpenBoard(b)}
                              className="p-2 rounded-xl hover:bg-white/10 transition cursor-pointer flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-7 h-7 rounded-lg shrink-0 bg-emerald-600 text-zinc-950 font-bold text-[11px] flex items-center justify-center shadow"
                                  style={{
                                    backgroundImage: b.background.startsWith('http')
                                      ? `url(${b.background})`
                                      : undefined,
                                    background: !b.background.startsWith('http')
                                      ? b.background
                                      : undefined,
                                    backgroundSize: 'cover',
                                  }}
                                >
                                  {!b.background.startsWith('http') && b.title.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-white group-hover:text-emerald-400 truncate">
                                    {b.title}
                                  </p>
                                  <p className="text-[10px] text-white/40 truncate">Active Board</p>
                                </div>
                              </div>
                              <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white transition" />
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-white/40 p-2">No recently viewed boards</p>
                        )}
                      </div>
                    </div>

                    {/* Workspace Quick Actions */}
                    <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl space-y-3">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5">
                        Quick Actions
                      </h3>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setIsCreateModalOpen(true)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span>Create New Board</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white transition" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectSection('templates')}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>Browse Templates</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white transition" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsInviteModalOpen(true)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span>Invite Team Members</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white transition" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsWorkspaceSettingsModalOpen(true)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Settings className="w-4 h-4 text-purple-400" />
                            <span>Workspace Settings</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white transition" />
                        </button>
                      </div>
                    </div>

                    {/* Pro Tips Card */}
                    <div className="bg-gradient-to-br from-emerald-950/30 to-green-950/30 border border-emerald-500/20 rounded-2xl p-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <Sparkles className="w-4 h-4" />
                        <span>Power User Tips</span>
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Ctrl+K</kbd> anywhere to search cards, lists, and boards.
                      </p>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">?</kbd> on any board to see all keyboard shortcuts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateBoard={handleCreateBoard}
      />

      <TemplatePreviewModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        initialTemplateId={selectedTemplateId}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspace?.id}
      />

      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceModalOpen}
        onClose={() => setIsCreateWorkspaceModalOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
      />

      <InviteMembersModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={activeWorkspace?.id}
        workspaceName={activeWorkspace?.name || 'My Workspace'}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      <WorkspaceSettingsModal
        isOpen={isWorkspaceSettingsModalOpen}
        onClose={() => setIsWorkspaceSettingsModalOpen(false)}
        workspace={activeWorkspace}
        onWorkspaceUpdated={(updated) => {
          setActiveWorkspace(updated);
          setWorkspaces((prev) =>
            prev.map((ws) => (ws.id === updated.id ? updated : ws))
          );
        }}
        onWorkspaceDeleted={(deletedId) => {
          setWorkspaces((prev) => prev.filter((ws) => ws.id !== deletedId));
          loadData();
        }}
      />
    </div>
  );
};

export default WorkspaceDashboardPage;
