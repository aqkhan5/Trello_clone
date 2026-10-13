// src/components/TemplatePreviewModal.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  Workflow,
  RotateCcw,
  AlertTriangle,
  Bug,
  Rocket,
  Layers,
  Loader2,
} from 'lucide-react';
import { boardService } from '../services/boardService';
import { listService } from '../services/listService';
import { cardService } from '../services/cardService';
import { recordRecentBoard } from '../services/boardNavService';
import type { Workspace } from '../services/workspaceService';

export interface TemplateDefinition {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  description: string;
  background: string;
  iconType: 'workflow' | 'rotate' | 'alert' | 'bug' | 'rocket';
  lists: {
    title: string;
    cards: { title: string; description?: string }[];
  }[];
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'kanban-wip',
    title: 'Kanban with WIP Limits',
    category: 'Engineering & Operations',
    subtitle: 'Strict flow controls for platform teams',
    description:
      'Designed for engineering and platform teams needing strict work-in-progress (WIP) controls and continuous delivery flow. Limit bottlenecks and optimize cycle times.',
    background: 'linear-gradient(180deg, #064e3b, #022c22)',
    iconType: 'workflow',
    lists: [
      {
        title: 'Backlog',
        cards: [
          {
            title: 'User Authentication & OAuth2 Flow',
            description: 'Implement JWT access/refresh token pairs and social logins.',
          },
          {
            title: 'API Rate Limiting & Throttling',
            description: 'Protect endpoints using Redis token bucket algorithm.',
          },
          {
            title: 'Database Migration & Backup Automation',
            description: 'Automate daily database snapshots and offsite backups.',
          },
        ],
      },
      {
        title: 'Ready for Dev (WIP: 3)',
        cards: [
          {
            title: 'Webhook Subscription System',
            description: 'Allow clients to subscribe to board and card events.',
          },
          {
            title: 'Cache Layer Optimization',
            description: 'Add Redis caching to hot dashboard endpoints.',
          },
        ],
      },
      {
        title: 'In Progress (WIP: 2)',
        cards: [
          {
            title: 'Payment Gateway Integration',
            description: 'Connect Stripe checkout and subscription webhooks.',
          },
          {
            title: 'SSL Certificate Automated Renewal',
            description: 'Configure certbot and Let’s Encrypt automated cron.',
          },
        ],
      },
      {
        title: 'Code Review / QA',
        cards: [
          {
            title: 'Security Audit & Pen-Test Hardening',
            description: 'Address OWASP Top 10 vulnerabilities and sanitize inputs.',
          },
        ],
      },
      {
        title: 'Done',
        cards: [
          {
            title: 'Initial Infrastructure Setup',
            description: 'Terraform definitions and VPC setup.',
          },
          {
            title: 'CI/CD Pipeline v1',
            description: 'GitHub Actions automated testing and deployment.',
          },
        ],
      },
    ],
  },
  {
    id: 'scrum-sprints',
    title: 'Bi-Weekly Scrum Sprints',
    category: 'Agile Development',
    subtitle: 'Backlog grooming, sprints & retros',
    description:
      'A structured 2-week sprint cycle template for agile teams. Facilitates backlog grooming, active sprint execution, code review, and retrospectives.',
    background: 'linear-gradient(180deg, #1e3a8a, #0f172a)',
    iconType: 'rotate',
    lists: [
      {
        title: 'Sprint Backlog',
        cards: [
          {
            title: 'Story: User Profile Avatar Customization',
            description: 'Users can upload custom avatars or choose initials.',
          },
          {
            title: 'Task: Sentry Error Reporting Integration',
            description: 'Catch and report uncaught frontend and backend exceptions.',
          },
          {
            title: 'Spike: Redis Cluster Benchmarking',
            description: 'Evaluate latency under 10k concurrent websocket connections.',
          },
        ],
      },
      {
        title: 'In Sprint (Active)',
        cards: [
          {
            title: 'Feature: Card Commenting & Activity Feeds',
            description: 'Real-time collaborative comments on cards.',
          },
          {
            title: 'Bug: Fix Member Dropdown Overflow',
            description: 'Resolve z-index clipping in mobile drawers.',
          },
        ],
      },
      {
        title: 'In Review / Testing',
        cards: [
          {
            title: 'PR #84: Fractional List Reordering',
            description: 'Implement 65,536 scale for middle inserts.',
          },
        ],
      },
      {
        title: 'Sprint Retrospective',
        cards: [
          {
            title: 'What went exceptionally well?',
            description: 'Team delivered committed tickets ahead of schedule.',
          },
          {
            title: 'What could be improved?',
            description: 'Refine PR review turnaround times.',
          },
        ],
      },
      {
        title: 'Completed & Released',
        cards: [
          {
            title: 'Sprint 14 Deliverables',
            description: 'All committed tickets delivered and deployed.',
          },
        ],
      },
    ],
  },
  {
    id: 'devops-postmortem',
    title: 'DevOps Post-Mortems',
    category: 'Incident Management',
    subtitle: 'Incident timelines & action trackers',
    description:
      'Structured blameless post-mortem framework for production outages. Track incident timelines, 5-Whys root cause analysis, and preventative engineering action items.',
    background: 'linear-gradient(180deg, #881337, #4c0519)',
    iconType: 'alert',
    lists: [
      {
        title: 'Incident Intake & Triage',
        cards: [
          {
            title: 'INC-201: DB Connection Pool Exhaustion',
            description: '502 Bad Gateway observed on primary API cluster.',
          },
          {
            title: 'INC-202: SSL Certificate Expiry Warning',
            description: 'Wildcard certificate expiring in 48 hours.',
          },
        ],
      },
      {
        title: 'Root Cause Analysis (5 Whys)',
        cards: [
          {
            title: 'Identify Primary Failure Trigger',
            description: 'Connection leak identified in background worker task.',
          },
          {
            title: 'Timeline Reconstruction',
            description: 'Chronological log alignment across nginx and app servers.',
          },
        ],
      },
      {
        title: 'Action Items in Progress',
        cards: [
          {
            title: 'Scale Database Read Replicas',
            description: 'Add 2 additional read replicas to handle burst traffic.',
          },
          {
            title: 'Automate Connection Pool Timeout',
            description: 'Enforce max connection lifetime of 300 seconds.',
          },
        ],
      },
      {
        title: 'Preventative Measures',
        cards: [
          {
            title: 'Prometheus Alert for DB Pool Saturation',
            description: 'Alert team when pool saturation exceeds 80%.',
          },
          {
            title: 'Chaos Engineering Game Day',
            description: 'Simulate database failover under load.',
          },
        ],
      },
      {
        title: 'Resolved & Closed',
        cards: [
          {
            title: 'INC-198: CDN Cache Purge Outage',
            description: 'Root cause resolved; runbook updated.',
          },
        ],
      },
    ],
  },
  {
    id: 'bug-tracker',
    title: 'Bug Tracking & Triage',
    category: 'Quality Assurance',
    subtitle: 'Report, reproduce, fix and verify',
    description:
      'Manage software bugs, prioritize severity, track reproduction steps, and coordinate QA verification before release.',
    background: 'linear-gradient(180deg, #4c1d95, #1e1b4b)',
    iconType: 'bug',
    lists: [
      {
        title: 'Reported Bugs',
        cards: [
          { title: 'BUG-401: Dark mode toggle flashes white on reload' },
          { title: 'BUG-402: Attachment upload fails on files > 10MB' },
        ],
      },
      {
        title: 'Confirmed & Prioritized',
        cards: [
          { title: 'BUG-398: Drag-and-drop glitches on iOS Safari' },
        ],
      },
      {
        title: 'Fix in Progress',
        cards: [
          { title: 'BUG-395: Due date picker timezone offset bug' },
        ],
      },
      {
        title: 'Ready for QA',
        cards: [
          { title: 'BUG-390: Invitation token expiry redirect' },
        ],
      },
      {
        title: 'Verified & Closed',
        cards: [
          { title: 'BUG-382: Memory leak in long-lived board websocket' },
        ],
      },
    ],
  },
  {
    id: 'product-roadmap',
    title: 'Product Roadmap & Launches',
    category: 'Product Management',
    subtitle: 'Quarterly objectives and feature delivery',
    description:
      'Align cross-functional teams with quarterly themes, feature exploration, beta testing, and public release tracking.',
    background: 'linear-gradient(180deg, #155e75, #083344)',
    iconType: 'rocket',
    lists: [
      {
        title: 'Now (Current Quarter)',
        cards: [
          { title: 'Real-Time Collaborative Editing' },
          { title: 'Mobile Native Notifications' },
        ],
      },
      {
        title: 'Next (Next Quarter)',
        cards: [
          { title: 'Custom Fields Power-Up' },
          { title: 'Automated Rule Builder' },
        ],
      },
      {
        title: 'Later / Exploration',
        cards: [
          { title: 'AI-Powered Card Summaries' },
          { title: 'Git & Webhook Two-Way Sync' },
        ],
      },
      {
        title: 'Released / Launched',
        cards: [
          { title: 'Global Search & Command Palette' },
          { title: 'Fractional Position Scaling' },
        ],
      },
    ],
  },
];

export interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplateId?: string;
  workspaces: Workspace[];
  activeWorkspaceId?: string;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  initialTemplateId = 'kanban-wip',
  workspaces,
  activeWorkspaceId,
}) => {
  const navigate = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);
  const [boardTitle, setBoardTitle] = useState('');
  const [targetWorkspaceId, setTargetWorkspaceId] = useState('');
  const [visibility, setVisibility] = useState<'WORKSPACE' | 'PRIVATE'>('WORKSPACE');
  const [isCreating, setIsCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedTemplate =
    TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];

  useEffect(() => {
    if (initialTemplateId) {
      setSelectedTemplateId(initialTemplateId);
    }
  }, [initialTemplateId]);

  useEffect(() => {
    if (selectedTemplate) {
      setBoardTitle(selectedTemplate.title);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (activeWorkspaceId) {
      setTargetWorkspaceId(activeWorkspaceId);
    } else if (workspaces.length > 0) {
      setTargetWorkspaceId(workspaces[0].id);
    }
  }, [activeWorkspaceId, workspaces]);

  if (!isOpen) return null;

  const handleUseTemplate = async () => {
    if (!targetWorkspaceId) {
      setErrorMsg('Please select a workspace for this board.');
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);

    try {
      // 1. Create Board
      setStatusMessage('Creating template board...');
      const createdBoard = await boardService.createBoard({
        title: boardTitle.trim() || selectedTemplate.title,
        workspace_id: targetWorkspaceId,
        background: selectedTemplate.background,
        visibility: visibility,
      });

      // 2. Create Starter Lists in Sequence
      for (let i = 0; i < selectedTemplate.lists.length; i++) {
        const listDef = selectedTemplate.lists[i];
        setStatusMessage(`Creating list: "${listDef.title}" (${i + 1}/${selectedTemplate.lists.length})...`);
        const createdList = await listService.createList({
          title: listDef.title,
          board_id: createdBoard.id,
          position: (i + 1) * 65536,
        });

        // 3. Create Starter Cards for this List
        for (let j = 0; j < listDef.cards.length; j++) {
          const cardDef = listDef.cards[j];
          await cardService.createCard({
            title: cardDef.title,
            description: cardDef.description,
            list_id: createdList.id,
            position: (j + 1) * 65536,
          });
        }
      }

      // 4. Record in Recent Boards
      const matchedWs = workspaces.find((w) => w.id === targetWorkspaceId);
      recordRecentBoard({
        id: createdBoard.id,
        title: createdBoard.title,
        workspaceId: targetWorkspaceId,
        workspaceName: matchedWs?.name || 'Workspace',
        background: createdBoard.background,
      });

      setStatusMessage('Board ready! Redirecting...');
      setTimeout(() => {
        onClose();
        navigate(`/board/${createdBoard.id}`);
      }, 300);
    } catch (err: any) {
      console.error('Failed to create template board:', err);
      setErrorMsg(
        err?.response?.data?.detail || err?.message || 'Failed to instantiate template board.'
      );
      setIsCreating(false);
      setStatusMessage('');
    }
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'workflow':
        return <Workflow className="w-4 h-4 text-emerald-400" />;
      case 'rotate':
        return <RotateCcw className="w-4 h-4 text-emerald-400" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'bug':
        return <Bug className="w-4 h-4 text-purple-400" />;
      case 'rocket':
        return <Rocket className="w-4 h-4 text-cyan-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => {
        if (!isCreating) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Engineering Board Templates</h2>
              <p className="text-[11px] text-white/50">
                Pre-configured workflows with starter lists and cards
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isCreating}
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left sidebar (template catalog) & Right preview */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left catalog selector */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 p-3 space-y-1 overflow-y-auto bg-black/20 shrink-0">
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40 block">
              Available Templates
            </span>
            {TEMPLATES.map((tpl) => {
              const isSelected = tpl.id === selectedTemplate.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  disabled={isCreating}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-white/15 border border-white/20 text-white shadow-sm'
                      : 'hover:bg-white/5 text-white/70 border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{renderIcon(tpl.iconType)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate text-white">{tpl.title}</p>
                    <p className="text-[10px] text-white/50 truncate">{tpl.category}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right template preview & instantiation panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Banner preview */}
            <div
              className="rounded-2xl p-5 border border-white/15 shadow-inner relative overflow-hidden"
              style={{ background: selectedTemplate.background }}
            >
              <div className="relative z-10 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-bold backdrop-blur-sm border border-white/10">
                  {renderIcon(selectedTemplate.iconType)}
                  {selectedTemplate.category}
                </span>
                <h3 className="text-base font-bold text-white">{selectedTemplate.title}</h3>
                <p className="text-xs text-white/80 max-w-xl leading-relaxed">
                  {selectedTemplate.description}
                </p>
              </div>
            </div>

            {/* Included Lists & Sample Cards Preview */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Starter Lists & Cards Included ({selectedTemplate.lists.length} lists)
                </h4>
                <span className="text-[10px] text-white/40">Scroll horizontally to inspect</span>
              </div>

              {/* Mini Kanban Columns Preview */}
              <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {selectedTemplate.lists.map((list, lIdx) => (
                  <div
                    key={lIdx}
                    className="w-48 shrink-0 rounded-xl bg-black/40 border border-white/10 p-2.5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="font-semibold text-white text-[11px] truncate">
                        {list.title}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">
                        {list.cards.length}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                      {list.cards.map((card, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-2 rounded-lg bg-white/5 border border-white/5 text-[11px] text-white/80 space-y-1 hover:border-white/15 transition"
                        >
                          <p className="font-medium text-white line-clamp-1">{card.title}</p>
                          {card.description && (
                            <p className="text-[9px] text-white/40 line-clamp-2 leading-tight">
                              {card.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customization Form */}
            <div className="rounded-xl bg-black/40 border border-white/10 p-4 space-y-3">
              <span className="text-xs font-bold text-white block">Create from this template</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Board Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/70">Board Title</label>
                  <input
                    type="text"
                    disabled={isCreating}
                    value={boardTitle}
                    onChange={(e) => setBoardTitle(e.target.value)}
                    placeholder="Enter board title..."
                    className="w-full h-8 rounded-lg border border-white/15 bg-white/5 px-2.5 text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Workspace Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/70">Target Workspace</label>
                  <select
                    disabled={isCreating}
                    value={targetWorkspaceId}
                    onChange={(e) => setTargetWorkspaceId(e.target.value)}
                    className="w-full h-8 rounded-lg border border-white/15 bg-zinc-800 px-2.5 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visibility Option */}
              <div className="flex items-center gap-4 pt-1 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tplVisibility"
                    value="WORKSPACE"
                    checked={visibility === 'WORKSPACE'}
                    onChange={() => setVisibility('WORKSPACE')}
                    className="accent-blue-500"
                  />
                  <span className="text-white/80">Workspace visible</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tplVisibility"
                    value="PRIVATE"
                    checked={visibility === 'PRIVATE'}
                    onChange={() => setVisibility('PRIVATE')}
                    className="accent-blue-500"
                  />
                  <span className="text-white/80">Private</span>
                </label>
              </div>

              {errorMsg && (
                <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between shrink-0">
          <div className="text-xs text-white/50">
            {isCreating ? (
              <span className="flex items-center gap-2 text-emerald-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {statusMessage}
              </span>
            ) : (
              <span>Template will create {selectedTemplate.lists.length} lists with starter cards</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isCreating}
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs text-white/70 hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isCreating || !boardTitle.trim()}
              onClick={handleUseTemplate}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-50 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Board...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create from Template</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;
