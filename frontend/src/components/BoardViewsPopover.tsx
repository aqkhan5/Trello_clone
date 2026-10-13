import React from 'react';
import {
  Kanban,
  Table as TableIcon,
  Calendar,
  Gauge,
  MapPin,
  Lock,
  X,
  Check,
  Sparkles,
} from 'lucide-react';

export type BoardViewMode = 'board' | 'table' | 'calendar' | 'timeline' | 'dashboard' | 'map';

export interface BoardViewsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: BoardViewMode;
  onSelectView: (view: BoardViewMode) => void;
  isPremium?: boolean;
  onUpgradeToPremium?: () => void;
}

export const BoardViewsPopover: React.FC<BoardViewsPopoverProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectView,
  isPremium = false,
  onUpgradeToPremium,
}) => {
  if (!isOpen) return null;

  const views: Array<{
    id: BoardViewMode;
    label: string;
    icon: React.ReactNode;
    isLocked: boolean;
  }> = [
    {
      id: 'board',
      label: 'Board',
      icon: <Kanban className="h-4 w-4" />,
      isLocked: false,
    },
    {
      id: 'table',
      label: 'Table',
      icon: <TableIcon className="h-4 w-4" />,
      isLocked: !isPremium,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="h-4 w-4" />,
      isLocked: !isPremium,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="15" y2="6" strokeLinecap="round" />
          <line x1="8" y1="12" x2="20" y2="12" strokeLinecap="round" />
          <line x1="5" y1="18" x2="13" y2="18" strokeLinecap="round" />
        </svg>
      ),
      isLocked: !isPremium,
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Gauge className="h-4 w-4" />,
      isLocked: !isPremium,
    },
    {
      id: 'map',
      label: 'Map',
      icon: <MapPin className="h-4 w-4" />,
      isLocked: !isPremium,
    },
  ];

  return (
    <div
      className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 rounded-2xl border border-white/10 bg-[#22272b] p-3.5 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <h3 className="text-xs font-semibold text-white/90">
          {isPremium ? 'Board Views' : 'Upgrade for Views'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Views List */}
      <div className="space-y-1">
        {views.map((v) => {
          const isSelected = currentView === v.id;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                onSelectView(v.id);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer group ${
                isSelected
                  ? 'bg-white/15 text-white font-semibold shadow-sm'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isSelected ? 'text-blue-400' : 'text-white/60 group-hover:text-white'}>
                  {v.icon}
                </span>
                <span>{v.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                {v.isLocked && !isSelected && (
                  <Lock className="h-3.5 w-3.5 text-white/40 group-hover:text-white/70 transition" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Promo Section (Authentic match to Trello screenshot) */}
      {!isPremium ? (
        <div className="mt-3.5 pt-3 border-t border-white/10 space-y-2.5">
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight">
              See your work in new ways
            </h4>
            <p className="text-[11px] text-white/60 leading-relaxed mt-1">
              View key timelines, assignments, data, and more directly from your Quasha board with Quasha Premium.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onUpgradeToPremium) onUpgradeToPremium();
            }}
            className="w-full rounded-lg bg-[#579dff] hover:bg-[#85b8ff] active:scale-95 text-[#1d2125] text-xs font-bold py-2 px-3 shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Upgrade Workspace to Premium</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onUpgradeToPremium) onUpgradeToPremium();
            }}
            className="w-full text-center text-[11px] text-white/60 hover:text-white underline cursor-pointer transition block"
          >
            Learn more about Quasha Premium
          </button>
        </div>
      ) : (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-400 px-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Quasha Premium Active</span>
          </div>
          <span className="text-[10px] text-white/40">All Views Unlocked</span>
        </div>
      )}
    </div>
  );
};
