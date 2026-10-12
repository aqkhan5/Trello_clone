import React, { useState, useMemo } from 'react';
import {
  Kanban,
  Table as TableIcon,
  Calendar as CalendarIcon,
  Gauge,
  MapPin,
  Clock,
  CheckCircle2,
  CheckSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  BarChart3,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import type { KanbanColumnItem, KanbanCardItem } from '../pages/KanbanBoardPage';
import type { BoardViewMode } from './BoardViewsPopover';

export interface BoardViewsCanvasProps {
  viewMode: BoardViewMode;
  columns: KanbanColumnItem[];
  onCardClick: (card: KanbanCardItem, columnTitle: string) => void;
  onAddCard?: (listId: string, title: string) => void;
  onToggleCardCompletion?: (cardId: string, completed: boolean) => void;
  onSwitchToBoard: () => void;
}

export const BoardViewsCanvas: React.FC<BoardViewsCanvasProps> = ({
  viewMode,
  columns,
  onCardClick,
  onAddCard,
  onToggleCardCompletion,
  onSwitchToBoard,
}) => {
  const [tableSearch, setTableSearch] = useState('');
  const [selectedListFilter, setSelectedListFilter] = useState<string>('all');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [timelineScale, setTimelineScale] = useState<'days' | 'weeks'>('days');
  const [selectedLocationCard, setSelectedLocationCard] = useState<KanbanCardItem | null>(null);

  // Flatten all cards with column titles
  const allCards = useMemo(() => {
    return columns.flatMap((col) =>
      col.cards.map((card) => ({
        ...card,
        columnTitle: col.title,
        columnId: col.id,
      }))
    );
  }, [columns]);

  // Filtered cards for Table view
  const tableFilteredCards = useMemo(() => {
    return allCards.filter((card) => {
      const matchesSearch =
        !tableSearch.trim() ||
        card.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
        card.columnTitle.toLowerCase().includes(tableSearch.toLowerCase());
      const matchesList =
        selectedListFilter === 'all' || card.columnId === selectedListFilter;
      return matchesSearch && matchesList;
    });
  }, [allCards, tableSearch, selectedListFilter]);

  // Metrics for Dashboard view
  const dashboardStats = useMemo(() => {
    const total = allCards.length;
    const completed = allCards.filter((c) => c.completed).length;
    const withDueDate = allCards.filter((c) => Boolean(c.dueDate));
    const now = Date.now();
    const overdue = withDueDate.filter((c) => !c.completed && new Date(c.dueDate!).getTime() < now).length;
    const dueSoon = withDueDate.filter((c) => {
      if (c.completed) return false;
      const diff = new Date(c.dueDate!).getTime() - now;
      return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
    }).length;

    let totalChecklist = 0;
    let completedChecklist = 0;
    allCards.forEach((c) => {
      if (c.checklist) {
        totalChecklist += c.checklist.total;
        completedChecklist += c.checklist.current;
      }
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const checklistRate =
      totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

    return {
      total,
      completed,
      overdue,
      dueSoon,
      completionRate,
      totalChecklist,
      completedChecklist,
      checklistRate,
    };
  }, [allCards]);

  // Calendar days calculation
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstWeekday = firstDayOfMonth.getDay();
    const leadDays = firstWeekday === 0 ? 6 : firstWeekday - 1;

    const days: Array<{ date: Date; isCurrentMonth: boolean; cards: typeof allCards }> = [];

    // Lead days
    for (let i = leadDays; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, isCurrentMonth: false, cards: [] });
    }

    // Days of current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      const dKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const cards = allCards.filter((c) => {
        if (!c.dueDate) return false;
        const parsed = new Date(c.dueDate);
        if (isNaN(parsed.getTime())) return false;
        const cKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
        return cKey === dKey;
      });
      days.push({ date: d, isCurrentMonth: true, cards });
    }

    // Trailing days
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, cards: [] });
    }

    return days;
  }, [calendarDate, allCards]);

  // Timeline days (14 days window)
  const timelineDays = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 3);
    return Array.from({ length: 14 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      const isToday = d.toDateString() === new Date().toDateString();
      return {
        date: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNum: d.getDate(),
        isToday,
      };
    });
  }, []);

  // Map mock locations
  const mapLocations = useMemo(() => {
    const mockCoords = [
      { city: 'San Francisco, CA', lat: 37.7749, lng: -122.4194, x: 20, y: 38 },
      { city: 'New York, NY', lat: 40.7128, lng: -74.006, x: 30, y: 35 },
      { city: 'London, UK', lat: 51.5074, lng: -0.1278, x: 48, y: 28 },
      { city: 'Berlin, DE', lat: 52.52, lng: 13.405, x: 53, y: 27 },
      { city: 'Tokyo, JP', lat: 35.6762, lng: 139.6503, x: 82, y: 40 },
    ];
    return allCards.map((card, idx) => ({
      ...card,
      location: mockCoords[idx % mockCoords.length],
    }));
  }, [allCards]);

  if (viewMode === 'board') return null;

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-black/20 text-white select-none">
      {/* ================= 1. TABLE VIEW ================= */}
      {viewMode === 'table' && (
        <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar">
          <div className="max-w-6xl mx-auto rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl overflow-hidden shadow-2xl">
            {/* Table Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">Board Table</h2>
                  <span className="text-xs text-white/50">({tableFilteredCards.length} cards)</span>
                </div>

                {/* List Filter Dropdown */}
                <select
                  value={selectedListFilter}
                  onChange={(e) => setSelectedListFilter(e.target.value)}
                  className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-white/80 focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Lists</option>
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search table cards..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="rounded-lg bg-black/40 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400 w-48 sm:w-60"
                  />
                </div>

                {onAddCard && columns.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onAddCard(columns[0]?.id, 'New Table Card')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0052cc] hover:bg-blue-600 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Card</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onSwitchToBoard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition cursor-pointer"
                >
                  <Kanban className="w-3.5 h-3.5 text-blue-400" />
                  <span>Switch to Board</span>
                </button>
              </div>
            </div>

            {/* Table Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/80">
                <thead className="bg-black/30 text-white/50 text-[11px] uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Card Title</th>
                    <th className="px-6 py-3 font-semibold">List</th>
                    <th className="px-6 py-3 font-semibold">Labels</th>
                    <th className="px-6 py-3 font-semibold">Due Date</th>
                    <th className="px-6 py-3 font-semibold">Checklist</th>
                    <th className="px-6 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tableFilteredCards.map((card) => (
                    <tr
                      key={card.id}
                      onClick={() => onCardClick(card, card.columnTitle)}
                      className="hover:bg-white/5 cursor-pointer transition group"
                    >
                      <td className="px-6 py-3.5 font-medium text-white group-hover:text-blue-400">
                        <span className="line-clamp-1">{card.title}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-medium text-white/70">
                          {card.columnTitle}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {card.tags && card.tags.length > 0 ? (
                            card.tags.map((t) => (
                              <span
                                key={t.id}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold text-white ${t.colorClass}`}
                              >
                                {t.label}
                              </span>
                            ))
                          ) : (
                            <span className="text-white/30 text-[11px]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        {card.dueDate ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-white/70">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {card.dueDate}
                          </span>
                        ) : (
                          <span className="text-white/30 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {card.checklist ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-white/60">
                            <CheckSquare className="w-3 h-3" />
                            {card.checklist.current}/{card.checklist.total}
                          </span>
                        ) : (
                          <span className="text-white/30 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {onToggleCardCompletion && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCardCompletion(card.id, !card.completed);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              card.completed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                            <span>{card.completed ? 'Completed' : 'Mark Done'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tableFilteredCards.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                        No cards match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. CALENDAR VIEW ================= */}
      {viewMode === 'calendar' && (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center rounded-md bg-white/5 p-0.5 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(calendarDate);
                    d.setMonth(d.getMonth() - 1);
                    setCalendarDate(d);
                  }}
                  className="p-1 text-white/60 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date())}
                  className="px-2 py-0.5 text-[11px] font-medium text-white/80 hover:text-white"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(calendarDate);
                    d.setMonth(d.getMonth() + 1);
                    setCalendarDate(d);
                  }}
                  className="p-1 text-white/60 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onSwitchToBoard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition cursor-pointer"
            >
              <Kanban className="w-3.5 h-3.5 text-blue-400" />
              <span>Switch to Board</span>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden mt-4">
            <div className="grid grid-cols-7 border-b border-white/10 bg-black/40 text-center py-2 text-xs font-bold text-white/60">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
              {calendarDays.map((cell, idx) => (
                <div
                  key={idx}
                  className={`min-h-[90px] p-2 border-b border-r border-white/5 flex flex-col transition ${
                    !cell.isCurrentMonth
                      ? 'bg-black/30 opacity-40'
                      : cell.date.toDateString() === new Date().toDateString()
                      ? 'bg-blue-950/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mb-1 ${
                      cell.date.toDateString() === new Date().toDateString()
                        ? 'bg-[#0052cc] text-white'
                        : 'text-white/70'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                    {cell.cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => onCardClick(card, card.columnTitle)}
                        className="rounded bg-zinc-800/90 hover:bg-zinc-700 border border-white/10 px-1.5 py-1 text-[10px] font-medium text-white truncate cursor-pointer transition"
                      >
                        {card.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. TIMELINE VIEW ================= */}
      {viewMode === 'timeline' && (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">Project Timeline / Gantt</h2>
              <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setTimelineScale('days')}
                  className={`px-2.5 py-1 rounded transition ${
                    timelineScale === 'days' ? 'bg-[#0052cc] text-white font-semibold' : 'text-white/60'
                  }`}
                >
                  Days
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineScale('weeks')}
                  className={`px-2.5 py-1 rounded transition ${
                    timelineScale === 'weeks' ? 'bg-[#0052cc] text-white font-semibold' : 'text-white/60'
                  }`}
                >
                  Weeks
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onSwitchToBoard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition cursor-pointer"
            >
              <Kanban className="w-3.5 h-3.5 text-blue-400" />
              <span>Switch to Board</span>
            </button>
          </div>

          {/* Timeline Roadmap Matrix */}
          <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden mt-4">
            {/* Header Timeline Columns */}
            <div className="flex border-b border-white/10 bg-black/40">
              <div className="w-60 shrink-0 p-3 text-xs font-bold text-white/60 border-r border-white/10">
                Lists / Workflow Stages
              </div>
              <div className="flex-1 grid grid-cols-14 text-center py-2 text-xs font-semibold text-white/50 divide-x divide-white/5">
                {timelineDays.map((d, i) => (
                  <div key={i} className={d.isToday ? 'text-purple-400 font-bold bg-purple-950/20' : ''}>
                    <div>{d.dayName}</div>
                    <div className="text-[10px] opacity-70">{d.dayNum}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* List Rows with Cards Duration Bars */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {columns.map((col) => (
                <div key={col.id} className="flex min-h-[75px] hover:bg-white/[0.02] transition">
                  <div className="w-60 shrink-0 p-3 border-r border-white/10 flex flex-col justify-center">
                    <span className="text-xs font-bold text-white">{col.title}</span>
                    <span className="text-[10px] text-white/40">{col.cards.length} cards in this stage</span>
                  </div>

                  <div className="flex-1 grid grid-cols-14 relative p-2 items-center">
                    {col.cards.map((card, cIdx) => {
                      const offset = (cIdx * 2) % 10;
                      return (
                        <div
                          key={card.id}
                          onClick={() => onCardClick(card, col.title)}
                          style={{
                            gridColumnStart: Math.max(1, offset + 1),
                            gridColumnEnd: Math.min(14, offset + 4),
                          }}
                          className="rounded-lg bg-blue-600/80 hover:bg-blue-600 border border-blue-400/40 p-1.5 text-xs text-white truncate shadow-md cursor-pointer transition z-10 my-0.5"
                          title={card.title}
                        >
                          <span className="font-semibold truncate block">{card.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. DASHBOARD VIEW ================= */}
      {viewMode === 'dashboard' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-white">Board Analytics & Metrics</h2>
            </div>

            <button
              type="button"
              onClick={onSwitchToBoard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition cursor-pointer"
            >
              <Kanban className="w-3.5 h-3.5 text-blue-400" />
              <span>Switch to Board</span>
            </button>
          </div>

          {/* 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between text-white/50 text-xs mb-2">
                <span>Total Cards</span>
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{dashboardStats.total}</div>
              <div className="text-[11px] text-white/40 mt-1">Across {columns.length} columns</div>
            </div>

            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between text-white/50 text-xs mb-2">
                <span>Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">{dashboardStats.completed}</div>
              <div className="text-[11px] text-emerald-400/70 mt-1 font-semibold">
                {dashboardStats.completionRate}% completion rate
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between text-white/50 text-xs mb-2">
                <span>Due This Week</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">{dashboardStats.dueSoon}</div>
              <div className="text-[11px] text-white/40 mt-1">Upcoming deadlines</div>
            </div>

            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between text-white/50 text-xs mb-2">
                <span>Overdue</span>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400">{dashboardStats.overdue}</div>
              <div className="text-[11px] text-red-400/70 mt-1">Requires immediate attention</div>
            </div>
          </div>

          {/* Cards per list distribution */}
          <div className="p-5 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-lg space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
              Cards per List Distribution
            </h3>
            <div className="space-y-3">
              {columns.map((col) => {
                const count = col.cards.length;
                const pct = dashboardStats.total > 0 ? Math.round((count / dashboardStats.total) * 100) : 0;
                return (
                  <div key={col.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{col.title}</span>
                      <span className="text-white/50">
                        {count} cards ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. MAP VIEW ================= */}
      {viewMode === 'map' && (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-red-400" />
              <h2 className="text-base font-bold text-white">Board Locations & Map</h2>
            </div>

            <button
              type="button"
              onClick={onSwitchToBoard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition cursor-pointer"
            >
              <Kanban className="w-3.5 h-3.5 text-blue-400" />
              <span>Switch to Board</span>
            </button>
          </div>

          <div className="flex-1 flex gap-4 mt-4 overflow-hidden">
            {/* Left Locations List */}
            <div className="w-80 shrink-0 flex flex-col rounded-2xl border border-white/10 bg-zinc-900/80 p-3 overflow-y-auto space-y-2 custom-scrollbar">
              <h3 className="text-xs font-bold uppercase text-white/50 px-1 mb-1">
                Cards with Locations ({mapLocations.length})
              </h3>
              {mapLocations.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedLocationCard(card)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedLocationCard?.id === card.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-red-400 text-[11px] font-semibold mb-1">
                    <MapPin className="w-3 h-3" />
                    <span>{card.location.city}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{card.title}</h4>
                  <span className="text-[10px] text-white/50">{card.columnTitle}</span>
                </div>
              ))}
            </div>

            {/* Interactive World Map Canvas */}
            <div className="flex-1 rounded-2xl border border-white/10 bg-zinc-950/90 relative flex items-center justify-center overflow-hidden p-6">
              {/* World Map Graphic SVG */}
              <svg className="w-full h-full opacity-20" viewBox="0 0 1000 500" fill="none" stroke="currentColor">
                <path
                  d="M150,150 Q200,100 280,140 Q350,180 320,260 Q280,320 200,300 Z"
                  fill="white"
                  strokeWidth="2"
                />
                <path
                  d="M450,100 Q550,80 600,140 Q650,220 580,260 Q500,280 440,200 Z"
                  fill="white"
                  strokeWidth="2"
                />
                <path
                  d="M700,150 Q800,120 850,200 Q900,280 820,320 Q750,300 720,220 Z"
                  fill="white"
                  strokeWidth="2"
                />
              </svg>

              {/* Location Markers */}
              {mapLocations.map((card) => (
                <div
                  key={card.id}
                  onClick={() => onCardClick(card, card.columnTitle)}
                  style={{
                    position: 'absolute',
                    left: `${card.location.x}%`,
                    top: `${card.location.y}%`,
                  }}
                  className="group -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                >
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-red-400 opacity-75" />
                    <div className="h-8 w-8 rounded-full bg-red-500 border-2 border-white shadow-xl flex items-center justify-center text-white">
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 rounded-xl bg-zinc-900 border border-white/20 p-2 shadow-2xl text-xs z-30">
                    <p className="font-bold text-white truncate">{card.title}</p>
                    <p className="text-[10px] text-white/50">{card.location.city}</p>
                    <span className="inline-block mt-1 text-[9px] text-blue-400 font-semibold">
                      Click to open card details →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
