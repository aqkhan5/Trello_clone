import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Calendar1,
  CalendarDays,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  X,
  RefreshCw,
  Lock,
  Plus,
  Check,
  Clock,
  ArrowLeftRight,
  CalendarCheck,
  Sparkles,
  CheckSquare,
  Search,
} from 'lucide-react';
import type { KanbanColumnItem, KanbanCardItem } from '../pages/KanbanBoardPage';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // e.g., '10:00'
  endTime: string;   // e.g., '10:30'
  color: string;     // e.g., 'blue', 'purple', 'emerald'
  source: 'google' | 'outlook' | 'trello';
  description?: string;
}

export type PlannerViewMode = 'day' | 'week' | 'month' | 'custom' | 'agenda';

export interface BoardPlannerPanelProps {
  columns: KanbanColumnItem[];
  onClose: () => void;
  onCardClick: (card: KanbanCardItem, columnTitle: string) => void;
  onAddCardOnDate?: (date: Date, title: string, listId?: string) => void;
  onToggleCardCompletion?: (cardId: string, completed: boolean) => void;
  onUpdateCardDueDate?: (cardId: string, dueDate: string) => void;
  isFitToScreen?: boolean;
  onToggleFitToScreen?: () => void;
}

export const BoardPlannerPanel: React.FC<BoardPlannerPanelProps> = ({
  columns,
  onClose,
  onCardClick,
  onAddCardOnDate,
  onToggleCardCompletion,
  isFitToScreen = false,
  onToggleFitToScreen,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<PlannerViewMode>('day');
  const [customDaysCount, setCustomDaysCount] = useState<number>(3);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectedCalendars, setConnectedCalendars] = useState<string[]>([]);
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);
  const [addingSlot, setAddingSlot] = useState<number | null>(null);
  const [newSlotTitle, setNewSlotTitle] = useState('');
  const [newSlotListId, setNewSlotListId] = useState<string>(columns[0]?.id || '');
  const [agendaSearch, setAgendaSearch] = useState('');

  const viewMenuRef = useRef<HTMLDivElement>(null);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setIsViewMenuOpen(false);
      }
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format Helpers
  const monthShort = currentDate.toLocaleDateString('en-US', { month: 'short' });
  const monthFull = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = currentDate.getDate();

  // Timezone string (e.g. GMT+5)
  const timezoneStr = useMemo(() => {
    const offsetMinutes = -currentDate.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    return `GMT${sign}${hours}`;
  }, [currentDate]);

  // Date Key YYYY-MM-DD
  const getDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const currentDateKey = getDateKey(currentDate);

  // Navigate dates according to current view mode
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'day') {
        d.setDate(d.getDate() - 1);
      } else if (viewMode === 'week' || viewMode === 'agenda') {
        d.setDate(d.getDate() - 7);
      } else if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (viewMode === 'custom') {
        d.setDate(d.getDate() - customDaysCount);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'day') {
        d.setDate(d.getDate() + 1);
      } else if (viewMode === 'week' || viewMode === 'agenda') {
        d.setDate(d.getDate() + 7);
      } else if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (viewMode === 'custom') {
        d.setDate(d.getDate() + customDaysCount);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Flatten cards from all columns
  const allCardsWithList = useMemo(() => {
    return columns.flatMap((col) =>
      col.cards.map((card) => ({
        ...card,
        columnTitle: col.title,
        columnId: col.id,
      }))
    );
  }, [columns]);

  // Map of dateKey -> cards
  const cardsByDateKey = useMemo(() => {
    const map = new Map<string, typeof allCardsWithList>();
    allCardsWithList.forEach((card) => {
      if (!card.dueDate) return;
      const parsed = new Date(card.dueDate);
      if (isNaN(parsed.getTime())) return;
      const key = getDateKey(parsed);
      const list = map.get(key) || [];
      list.push(card);
      map.set(key, list);
    });
    return map;
  }, [allCardsWithList]);

  // Cards due on selected date (Day view)
  const cardsDueToday = useMemo(() => {
    return cardsByDateKey.get(currentDateKey) || [];
  }, [cardsByDateKey, currentDateKey]);

  // Week Days (Mon - Sun) for Week View
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
    d.setDate(d.getDate() + diff);

    return Array.from({ length: 7 }).map((_, i) => {
      const dayDate = new Date(d);
      dayDate.setDate(d.getDate() + i);
      const key = getDateKey(dayDate);
      return {
        date: dayDate,
        key,
        dayName: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: dayDate.getDate(),
        isToday: key === getDateKey(new Date()),
        cards: cardsByDateKey.get(key) || [],
      };
    });
  }, [currentDate, cardsByDateKey]);

  // Month Days for Month View
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const firstDayWeekday = firstDayOfMonth.getDay();
    const leadDays = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1; // Mon=0

    const days: Array<{ date: Date; key: string; isCurrentMonth: boolean; isToday: boolean; cards: typeof allCardsWithList }> = [];

    // Leading days from previous month
    for (let i = leadDays; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      const key = getDateKey(d);
      days.push({
        date: d,
        key,
        isCurrentMonth: false,
        isToday: key === getDateKey(new Date()),
        cards: cardsByDateKey.get(key) || [],
      });
    }

    // Days in current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      const key = getDateKey(d);
      days.push({
        date: d,
        key,
        isCurrentMonth: true,
        isToday: key === getDateKey(new Date()),
        cards: cardsByDateKey.get(key) || [],
      });
    }

    // Trailing days from next month to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const key = getDateKey(d);
      days.push({
        date: d,
        key,
        isCurrentMonth: false,
        isToday: key === getDateKey(new Date()),
        cards: cardsByDateKey.get(key) || [],
      });
    }

    return days;
  }, [currentDate, cardsByDateKey]);

  // Custom Days (e.g. 3, 4, 5 days starting from currentDate)
  const customDays = useMemo(() => {
    return Array.from({ length: customDaysCount }).map((_, i) => {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() + i);
      const key = getDateKey(d);
      return {
        date: d,
        key,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: key === getDateKey(new Date()),
        cards: cardsByDateKey.get(key) || [],
      };
    });
  }, [currentDate, customDaysCount, cardsByDateKey]);

  // Agenda list (all cards with due dates sorted chronologically)
  const agendaList = useMemo(() => {
    const cardsWithDue = allCardsWithList.filter((c) => Boolean(c.dueDate));
    cardsWithDue.sort((a, b) => {
      const dateA = new Date(a.dueDate!).getTime();
      const dateB = new Date(b.dueDate!).getTime();
      return dateA - dateB;
    });

    if (!agendaSearch.trim()) return cardsWithDue;
    return cardsWithDue.filter(
      (c) =>
        c.title.toLowerCase().includes(agendaSearch.toLowerCase()) ||
        c.columnTitle.toLowerCase().includes(agendaSearch.toLowerCase())
    );
  }, [allCardsWithList, agendaSearch]);

  // Simulate Calendar sync
  const handleSimulateSync = (provider: 'google' | 'outlook') => {
    if (!connectedCalendars.includes(provider)) {
      setConnectedCalendars((prev) => [...prev, provider]);
    }
    const sampleEvents: CalendarEvent[] = [
      {
        id: `ev-${Date.now()}-1`,
        title: 'Team Standup & Sync',
        startTime: '10:00',
        endTime: '10:30',
        color: provider === 'google' ? 'bg-blue-500/20 border-emerald-500 text-blue-200' : 'bg-sky-500/20 border-sky-500 text-sky-200',
        source: provider,
        description: 'Daily engineering standup and blocker discussion',
      },
      {
        id: `ev-${Date.now()}-2`,
        title: 'Architecture & Design Review',
        startTime: '14:00',
        endTime: '15:00',
        color: 'bg-purple-500/20 border-purple-500 text-purple-200',
        source: provider,
        description: 'Quasha frontend responsive layout & planning review',
      },
    ];
    setCustomEvents((prev) => [...prev, ...sampleEvents]);
    setIsConnectModalOpen(false);
  };

  // Add scheduled card from hourly slot
  const handleCreateInSlot = (hour: number) => {
    if (!newSlotTitle.trim()) return;
    const targetDate = new Date(currentDate);
    targetDate.setHours(hour, 0, 0, 0);

    if (onAddCardOnDate) {
      onAddCardOnDate(targetDate, newSlotTitle.trim(), newSlotListId);
    }
    setNewSlotTitle('');
    setAddingSlot(null);
  };

  // Hours to render (8 am to 7 pm)
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

  const formatHourLabel = (hour: number) => {
    if (hour === 0) return '12 am';
    if (hour < 12) return `${hour} am`;
    if (hour === 12) return '12 pm';
    return `${hour - 12} pm`;
  };

  const isConnected = connectedCalendars.length > 0;

  return (
    <div className="h-full flex flex-col rounded-2xl border border-white/10 bg-[#1d2125] text-white shadow-2xl overflow-hidden select-none relative">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-[#161a1d] shrink-0">
        {/* Left: Month Selector & Navigation */}
        <div className="flex items-center gap-1.5">
          {/* Month Selector Dropdown */}
          <div className="relative" ref={monthPickerRef}>
            <button
              type="button"
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>{monthShort}</span>
              <ChevronDown className="h-3 w-3 text-white/50" />
            </button>

            {isMonthPickerOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-44 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <p className="text-[10px] font-bold uppercase text-white/50 px-2 py-1">
                  Select Month
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                  ].map((m, idx) => {
                    const isSelected = currentDate.getMonth() === idx;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          newDate.setMonth(idx);
                          setCurrentDate(newDate);
                          setIsMonthPickerOpen(false);
                        }}
                        className={`rounded px-1.5 py-1 text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#0052cc] text-white font-bold'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Nav Controls: < Today > */}
          <div className="flex items-center rounded-md bg-white/5 p-0.5 border border-white/10 text-xs">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded p-1 text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="px-2 py-0.5 rounded text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              Today
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="rounded p-1 text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Next"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Change View Popover, More Options & Close */}
        <div className="flex items-center gap-1">
          {/* Change View Button & Popover (Exact match to Trello screenshot) */}
          <div className="relative" ref={viewMenuRef}>
            <button
              type="button"
              onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                isViewMenuOpen
                  ? 'bg-white/20 text-white'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
              title="Change view"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3 text-white/50" />
            </button>

            {/* Change View Popover Dropdown */}
            {isViewMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-white/10 bg-[#22272b] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-white/10 pb-1.5">
                  <span className="text-xs font-semibold text-white/90">Change view</span>
                  <button
                    type="button"
                    onClick={() => setIsViewMenuOpen(false)}
                    className="text-white/50 hover:text-white rounded p-0.5"
                    title="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 1. Fit to screen size */}
                <button
                  type="button"
                  onClick={() => {
                    if (onToggleFitToScreen) onToggleFitToScreen();
                    setIsViewMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowLeftRight className="h-4 w-4 text-white/70" />
                    <span>Fit to screen size</span>
                  </div>
                  {isFitToScreen && <Check className="h-4 w-4 text-white" />}
                </button>

                {/* 2. Day View */}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('day');
                    setIsViewMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar1 className="h-4 w-4 text-white/70" />
                    <span>Day</span>
                  </div>
                  {viewMode === 'day' && <Check className="h-4 w-4 text-white" />}
                </button>

                {/* 3. Week View */}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('week');
                    setIsViewMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="h-4 w-4 text-white/70" />
                    <span>Week</span>
                  </div>
                  {viewMode === 'week' && <Check className="h-4 w-4 text-white" />}
                </button>

                {/* 4. Month View */}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('month');
                    setIsViewMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarIcon className="h-4 w-4 text-white/70" />
                    <span>Month</span>
                  </div>
                  {viewMode === 'month' && <Check className="h-4 w-4 text-white" />}
                </button>

                {/* 5. Custom View */}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('custom');
                    setIsViewMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="h-4 w-4 text-white/70" />
                    <span>Custom</span>
                  </div>
                  {viewMode === 'custom' && <Check className="h-4 w-4 text-white" />}
                </button>

                {/* 6. Agenda View */}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('agenda');
                    setIsViewMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <svg
                      className="h-4 w-4 text-white/70"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="5" cy="7" r="1.5" />
                      <line x1="10" y1="7" x2="20" y2="7" />
                      <circle cx="5" cy="17" r="1.5" />
                      <line x1="10" y1="17" x2="20" y2="17" />
                    </svg>
                    <span>Agenda</span>
                  </div>
                  {viewMode === 'agenda' && <Check className="h-4 w-4 text-white" />}
                </button>
              </div>
            )}
          </div>

          {/* More Options Dropdown */}
          <div className="relative" ref={optionsMenuRef}>
            <button
              type="button"
              onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
              className="rounded p-1 text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Planner Options"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>

            {isOptionsMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-xl z-50 text-xs space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    setIsConnectModalOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                >
                  <RefreshCw className="h-3 w-3 text-emerald-400" />
                  <span>Connect calendar</span>
                </button>
                {isConnected && (
                  <button
                    type="button"
                    onClick={() => {
                      setConnectedCalendars([]);
                      setCustomEvents([]);
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <span>Disconnect calendars</span>
                  </button>
                )}
                <div className="h-px bg-white/10 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    onClose();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-white/60 hover:bg-white/10 hover:text-white flex items-center gap-2"
                >
                  <X className="h-3 w-3" />
                  <span>Close Planner</span>
                </button>
              </div>
            )}
          </div>

          {/* Direct Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close Planner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-Header according to View Mode */}
      <div className="px-4 py-2 border-b border-white/10 bg-[#1d2125] shrink-0">
        {viewMode === 'day' && (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-purple-400 tracking-wide">
                {dayName}
              </span>
              <span className="h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {dayNumber}
              </span>
            </div>
            <p className="text-[11px] text-white/40 font-medium mt-0.5">{timezoneStr}</p>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-purple-400">
                Week of {weekDays[0]?.dayName} {weekDays[0]?.dayNumber} – {weekDays[6]?.dayName} {weekDays[6]?.dayNumber}, {currentDate.getFullYear()}
              </span>
              <p className="text-[11px] text-white/40 font-medium mt-0.5">7-Day Weekly Planner</p>
            </div>
          </div>
        )}

        {viewMode === 'month' && (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-semibold text-purple-400">
                {monthFull}
              </span>
              <p className="text-[11px] text-white/40 font-medium mt-0.5">Month Overview</p>
            </div>
          </div>
        )}

        {viewMode === 'custom' && (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-purple-400">
                {customDays[0]?.dayName} {customDays[0]?.dayNumber} – {customDays[customDays.length - 1]?.dayName} {customDays[customDays.length - 1]?.dayNumber}
              </span>
              <p className="text-[11px] text-white/40 font-medium mt-0.5">{customDaysCount}-Day View</p>
            </div>
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs">
              {[3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setCustomDaysCount(cnt)}
                  className={`px-2 py-0.5 rounded transition ${
                    customDaysCount === cnt
                      ? 'bg-[#0052cc] text-white font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {cnt}D
                </button>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'agenda' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-400">
                Scheduled Agenda
              </span>
              <span className="text-[11px] text-white/40">
                {agendaList.length} scheduled {agendaList.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="relative">
              <Search className="h-3 w-3 text-white/40 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Search agenda cards..."
                value={agendaSearch}
                onChange={(e) => setAgendaSearch(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 pl-7 pr-2 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* ================= 1. DAY VIEW ================= */}
        {viewMode === 'day' && (
          <div className="relative py-2">
            {hours.map((hour) => {
              const hourCards = cardsDueToday.filter((c) => {
                const cardDate = new Date(c.dueDate!);
                return cardDate.getHours() === hour || (hour === 10 && cardDate.getHours() === 0);
              });

              const hourEvents = customEvents.filter((ev) => {
                const evHour = parseInt(ev.startTime.split(':')[0], 10);
                return evHour === hour;
              });

              const isAddingHere = addingSlot === hour;

              return (
                <div
                  key={hour}
                  className="group relative flex border-b border-white/5 min-h-[64px] hover:bg-white/[0.02] transition"
                >
                  <div className="w-12 shrink-0 pr-2 pt-1 text-right text-[11px] font-medium text-white/40 select-none">
                    {formatHourLabel(hour)}
                  </div>

                  <div className="flex-1 pr-3 pb-1 relative">
                    {!isAddingHere && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingSlot(hour);
                          setNewSlotTitle('');
                        }}
                        className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 rounded bg-white/10 hover:bg-white/20 p-1 text-white/60 hover:text-white transition cursor-pointer z-10"
                        title="Add task at this time"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}

                    {isAddingHere && (
                      <div className="mb-2 p-2 rounded-lg bg-zinc-800 border border-emerald-500/50 shadow-lg space-y-2 z-20 relative animate-in fade-in duration-150">
                        <input
                          type="text"
                          placeholder="Task or event title..."
                          autoFocus
                          value={newSlotTitle}
                          onChange={(e) => setNewSlotTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateInSlot(hour);
                            if (e.key === 'Escape') setAddingSlot(null);
                          }}
                          className="w-full rounded bg-black/40 border border-white/10 px-2 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                        />
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <select
                            value={newSlotListId}
                            onChange={(e) => setNewSlotListId(e.target.value)}
                            className="bg-zinc-700 text-white/80 rounded px-1.5 py-0.5 border border-white/10"
                          >
                            {columns.map((col) => (
                              <option key={col.id} value={col.id}>
                                {col.title}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setAddingSlot(null)}
                              className="px-2 py-0.5 rounded text-white/60 hover:bg-white/10"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateInSlot(hour)}
                              disabled={!newSlotTitle.trim()}
                              className="px-2.5 py-0.5 rounded bg-[#0052cc] text-white font-medium hover:bg-blue-600 disabled:opacity-40"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {hourEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`mb-1.5 rounded-md border px-2 py-1 text-xs shadow-sm flex items-center justify-between ${ev.color}`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                          <span className="font-semibold truncate">{ev.title}</span>
                        </div>
                        <span className="text-[10px] opacity-75 shrink-0 ml-1">
                          {ev.startTime} - {ev.endTime}
                        </span>
                      </div>
                    ))}

                    {hourCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => onCardClick(card, card.columnTitle)}
                        className="mb-1.5 rounded-md border border-white/10 bg-zinc-800/90 hover:bg-zinc-800 p-1.5 text-xs shadow cursor-pointer transition hover:border-white/20"
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="rounded bg-white/10 px-1 py-0.2 text-[9px] font-bold uppercase text-white/70">
                            {card.columnTitle}
                          </span>
                          {onToggleCardCompletion && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleCardCompletion(card.id, !card.completed);
                              }}
                              className={`flex items-center gap-0.5 rounded px-1 py-0.2 text-[9px] font-medium transition ${
                                card.completed
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'text-white/40 hover:text-white'
                              }`}
                            >
                              <Check className="h-2.5 w-2.5" />
                              {card.completed && <span>Done</span>}
                            </button>
                          )}
                        </div>
                        <p
                          className={`truncate font-medium ${
                            card.completed ? 'text-white/40 line-through' : 'text-white'
                          }`}
                        >
                          {card.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Empty State Illustration */}
            {!isConnected && customEvents.length === 0 && cardsDueToday.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
                <div className="pointer-events-auto max-w-[290px] text-center flex flex-col items-center animate-in fade-in duration-300">
                  <div className="flex items-center justify-center gap-3 mb-2 relative">
                    <div className="flex flex-col gap-2 items-center">
                      <div className="w-8 h-8 rounded-lg bg-[#0078d4] flex items-center justify-center text-white font-bold text-sm shadow-md border border-blue-400/30">
                        <span>O</span>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-white shadow-md border border-gray-200 flex flex-col items-center justify-center overflow-hidden">
                        <div className="w-full h-2.5 bg-[#4285f4]" />
                        <span className="text-[11px] font-black text-[#4285f4] -mt-0.5">31</span>
                      </div>
                    </div>

                    <div className="w-12 h-14 flex items-center justify-center">
                      <svg className="w-full h-full text-white/40" viewBox="0 0 50 50" fill="none">
                        <path d="M 5 15 C 25 15, 30 25, 45 25" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" fill="none" />
                        <path d="M 5 35 C 25 35, 30 25, 45 25" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" fill="none" />
                        <polygon points="45,21 50,25 45,29" fill="currentColor" />
                      </svg>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-[#0052cc] p-2 flex items-center justify-center shadow-xl border border-blue-400/30">
                      <div className="flex gap-1 items-start h-full">
                        <div className="w-2.5 h-6 bg-white rounded-[2px]" />
                        <div className="w-2.5 h-4 bg-white rounded-[2px]" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">Planner</h3>
                  <p className="mt-1 text-xs text-white/60 leading-relaxed">
                    Connect your calendars to get a side-by-side view of your Planner and your to-do's.
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(true)}
                    className="mt-3.5 flex items-center justify-center gap-2 rounded-md bg-[#0052cc] hover:bg-[#0747a6] active:scale-95 px-4 py-2 text-xs font-semibold text-white shadow-md transition cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Connect an account</span>
                  </button>

                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                    <Lock className="h-3 w-3" />
                    <span>Only you can see your Planner.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 2. WEEK VIEW ================= */}
        {viewMode === 'week' && (
          <div className="p-3 h-full flex flex-col">
            <div className="grid grid-cols-7 gap-2 h-full min-w-[700px]">
              {weekDays.map((colDay) => (
                <div
                  key={colDay.key}
                  className={`flex flex-col rounded-xl border p-2 min-h-[360px] transition ${
                    colDay.isToday
                      ? 'border-purple-500/40 bg-purple-950/10'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                    <span className="text-xs font-bold text-white/70">{colDay.dayName}</span>
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        colDay.isToday
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-white/60'
                      }`}
                    >
                      {colDay.dayNumber}
                    </span>
                  </div>

                  {/* Cards in Day Column */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {colDay.cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => onCardClick(card, card.columnTitle)}
                        className="rounded-lg border border-white/10 bg-zinc-800/80 hover:bg-zinc-800 p-2 text-xs shadow-sm cursor-pointer transition"
                      >
                        <span className="block rounded bg-white/10 px-1 py-0.2 text-[8px] font-bold uppercase text-white/60 mb-1 truncate">
                          {card.columnTitle}
                        </span>
                        <p className={`font-medium text-xs truncate ${card.completed ? 'line-through text-white/40' : 'text-white'}`}>
                          {card.title}
                        </p>
                      </div>
                    ))}
                    {colDay.cards.length === 0 && (
                      <div
                        onClick={() => {
                          if (onAddCardOnDate) {
                            onAddCardOnDate(colDay.date, 'New Task');
                          }
                        }}
                        className="h-20 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/5 hover:border-white/20 text-white/20 hover:text-white/60 transition cursor-pointer text-[10px]"
                      >
                        <Plus className="h-3 w-3 mb-0.5" />
                        <span>Add</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 3. MONTH VIEW ================= */}
        {viewMode === 'month' && (
          <div className="p-3 h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-white/10 bg-black/30 text-center py-1.5 text-xs font-bold text-white/60 rounded-t-xl">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-l border-white/5 rounded-b-xl overflow-hidden min-w-[600px] flex-1 auto-rows-fr">
              {monthDays.map((cell, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDate(cell.date);
                    setViewMode('day');
                  }}
                  className={`min-h-[75px] p-1.5 border-b border-r border-white/5 flex flex-col transition cursor-pointer ${
                    !cell.isCurrentMonth
                      ? 'bg-black/30 opacity-30'
                      : cell.isToday
                      ? 'bg-blue-950/20 hover:bg-blue-950/30'
                      : 'bg-zinc-900/30 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold rounded-full flex items-center justify-center ${
                        cell.isToday
                          ? 'h-5 w-5 bg-purple-600 text-white shadow'
                          : 'text-white/70'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    {cell.cards.length > 0 && (
                      <span className="text-[9px] text-white/40 font-bold">
                        {cell.cards.length}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {cell.cards.slice(0, 2).map((card) => (
                      <div
                        key={card.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardClick(card, card.columnTitle);
                        }}
                        className="rounded bg-zinc-800 px-1 py-0.5 text-[9px] font-medium text-white truncate border border-white/5"
                        title={card.title}
                      >
                        {card.title}
                      </div>
                    ))}
                    {cell.cards.length > 2 && (
                      <span className="text-[8px] text-purple-400 font-semibold">
                        +{cell.cards.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 4. CUSTOM VIEW ================= */}
        {viewMode === 'custom' && (
          <div className="p-3 h-full flex flex-col">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 h-full">
              {customDays.map((colDay) => (
                <div
                  key={colDay.key}
                  className={`flex flex-col rounded-xl border p-2.5 transition ${
                    colDay.isToday
                      ? 'border-purple-500/40 bg-purple-950/10'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                    <span className="text-xs font-bold text-white/80">{colDay.dayName}</span>
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        colDay.isToday
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-white/60'
                      }`}
                    >
                      {colDay.dayNumber}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                    {colDay.cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => onCardClick(card, card.columnTitle)}
                        className="rounded-lg border border-white/10 bg-zinc-800/90 hover:bg-zinc-800 p-2 text-xs shadow-sm cursor-pointer transition"
                      >
                        <span className="block rounded bg-white/10 px-1 py-0.2 text-[8px] font-bold uppercase text-white/60 mb-1 truncate">
                          {card.columnTitle}
                        </span>
                        <p className={`font-medium text-xs ${card.completed ? 'line-through text-white/40' : 'text-white'}`}>
                          {card.title}
                        </p>
                      </div>
                    ))}
                    {colDay.cards.length === 0 && (
                      <div
                        onClick={() => {
                          if (onAddCardOnDate) {
                            onAddCardOnDate(colDay.date, 'New Task');
                          }
                        }}
                        className="h-24 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/5 hover:border-white/20 text-white/20 hover:text-white/60 transition cursor-pointer text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mb-1" />
                        <span>Add card</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 5. AGENDA VIEW ================= */}
        {viewMode === 'agenda' && (
          <div className="p-3 space-y-3">
            {agendaList.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <CalendarCheck className="h-8 w-8 text-white/30 mx-auto" />
                <p className="text-xs text-white/50">No scheduled cards match your search</p>
              </div>
            ) : (
              agendaList.map((card) => {
                const cardDate = new Date(card.dueDate!);
                const isOverdue = cardDate.getTime() < Date.now() && !card.completed;
                const formattedDate = cardDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={card.id}
                    onClick={() => onCardClick(card, card.columnTitle)}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 p-3 transition cursor-pointer shadow-sm group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {onToggleCardCompletion && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCardCompletion(card.id, !card.completed);
                          }}
                          className={`h-5 w-5 rounded border flex items-center justify-center transition shrink-0 ${
                            card.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-white/30 hover:border-white text-transparent'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] font-bold uppercase text-white/60">
                            {card.columnTitle}
                          </span>
                          <span
                            className={`flex items-center gap-1 text-[11px] font-semibold ${
                              isOverdue ? 'text-red-400' : 'text-purple-400'
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            {formattedDate}
                          </span>
                        </div>
                        <p
                          className={`text-xs font-medium truncate ${
                            card.completed ? 'text-white/40 line-through' : 'text-white'
                          }`}
                        >
                          {card.title}
                        </p>
                      </div>
                    </div>

                    {card.checklist && (
                      <div className="flex items-center gap-1 text-[10px] text-white/40 shrink-0 ml-2">
                        <CheckSquare className="h-3 w-3" />
                        <span>{card.checklist.current}/{card.checklist.total}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Connect Calendar Modal */}
      {isConnectModalOpen && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Connect Calendar</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="rounded p-1 text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Sync your schedule to plan your cards side-by-side with your real calendar events.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSimulateSync('google')}
                className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-3 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-white flex flex-col items-center justify-center shadow overflow-hidden">
                    <div className="w-full h-2 bg-[#4285f4]" />
                    <span className="text-[9px] font-black text-[#4285f4]">31</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition">
                      Google Calendar
                    </div>
                    <div className="text-[10px] text-white/50">Personal & Google Workspace</div>
                  </div>
                </div>
                <Sparkles className="h-4 w-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleSimulateSync('outlook')}
                className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-3 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-[#0078d4] flex items-center justify-center text-white font-bold text-xs shadow">
                    O
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition">
                      Microsoft Outlook
                    </div>
                    <div className="text-[10px] text-white/50">Office 365 & Outlook.com</div>
                  </div>
                </div>
                <Sparkles className="h-4 w-4 text-sky-400 opacity-0 group-hover:opacity-100 transition" />
              </button>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
