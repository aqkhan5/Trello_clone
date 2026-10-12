import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  CheckSquare,
  Calendar as CalendarIcon,
  X,
  Check,
} from 'lucide-react';
import type { KanbanColumnItem, KanbanCardItem } from '../pages/KanbanBoardPage';

export interface BoardPlannerViewProps {
  columns: KanbanColumnItem[];
  onCardClick: (card: KanbanCardItem, columnTitle: string) => void;
  onAddCardOnDate?: (date: Date, title: string, listId?: string) => void;
  onToggleCardCompletion?: (cardId: string, completed: boolean) => void;
  onUpdateCardDueDate?: (cardId: string, dueDate: string) => void;
}

export const BoardPlannerView: React.FC<BoardPlannerViewProps> = ({
  columns,
  onCardClick,
  onAddCardOnDate,
  onToggleCardCompletion,
  onUpdateCardDueDate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [isUnscheduledOpen, setIsUnscheduledOpen] = useState(false);
  const [unscheduledSearch, setUnscheduledSearch] = useState('');
  const [addingOnDay, setAddingOnDay] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [selectedListId, setSelectedListId] = useState<string>(columns[0]?.id || '');

  // Flatten all cards with their list/column title
  const allCardsWithList = useMemo(() => {
    return columns.flatMap((col) =>
      col.cards.map((card) => ({
        ...card,
        columnTitle: col.title,
        columnId: col.id,
      }))
    );
  }, [columns]);

  // Unscheduled cards (no due date)
  const unscheduledCards = useMemo(() => {
    return allCardsWithList.filter((c) => !c.dueDate);
  }, [allCardsWithList]);

  const filteredUnscheduled = useMemo(() => {
    if (!unscheduledSearch.trim()) return unscheduledCards;
    return unscheduledCards.filter((c) =>
      c.title.toLowerCase().includes(unscheduledSearch.toLowerCase())
    );
  }, [unscheduledCards, unscheduledSearch]);

  // Helper to normalize dates for comparison (YYYY-MM-DD)
  const getDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseCardDate = (dateStr?: string): string | null => {
    if (!dateStr) return null;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return null;
    return getDateKey(parsed);
  };

  // Map of dateKey -> cards due on that day
  const cardsByDate = useMemo(() => {
    const map = new Map<string, typeof allCardsWithList>();
    allCardsWithList.forEach((card) => {
      const key = parseCardDate(card.dueDate);
      if (key) {
        const existing = map.get(key) || [];
        map.set(key, [...existing, card]);
      }
    });
    return map;
  }, [allCardsWithList]);

  // Compute Week Days (Monday to Sunday)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 = Sun, 1 = Mon ...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + diffToMonday);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [currentDate]);

  // Compute Month Days (Matrix of weeks for current month)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Starting day of week (Monday as 0)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startDayOfWeek; i > 0; i--) {
      const prev = new Date(year, month, 1 - i);
      days.push({ date: prev, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month padding to fill grid of 35 or 42
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const todayKey = getDateKey(new Date());

  // Quick Add Card on Date
  const handleConfirmAddCard = (day: Date) => {
    if (!newCardTitle.trim()) {
      setAddingOnDay(null);
      return;
    }
    const targetList = selectedListId || (columns[0]?.id ?? '');
    if (onAddCardOnDate) {
      onAddCardOnDate(day, newCardTitle.trim(), targetList);
    }
    setNewCardTitle('');
    setAddingOnDay(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      {/* Planner Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0">
        {/* Left: Navigation & Date Heading */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToday}
            className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10 p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-white tracking-tight">
            {viewMode === 'week' ? (
              <>
                {weekDays[0].toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                {' – '}
                {weekDays[6].toLocaleDateString('default', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </>
            ) : (
              currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })
            )}
          </h2>
        </div>

        {/* Right: View Switcher (Week / Month) & Unscheduled Drawer Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Week / Month Toggle */}
          <div className="flex items-center rounded-lg bg-white/10 p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-[#0052cc] text-white shadow-sm font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#0052cc] text-white shadow-sm font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Month
            </button>
          </div>

          {/* Unscheduled Cards Toggle */}
          <button
            type="button"
            onClick={() => setIsUnscheduledOpen(!isUnscheduledOpen)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer border ${
              isUnscheduledOpen
                ? 'bg-white/20 border-white/30 text-white'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-amber-400" />
            <span>Unscheduled</span>
            <span className="rounded-full bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
              {unscheduledCards.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Planner Grid Body + Unscheduled Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* The Calendar Area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 pb-20 custom-scrollbar">
          {viewMode === 'week' ? (
            /* ================= WEEK VIEW ================= */
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 min-h-[600px] flex-1">
              {weekDays.map((day) => {
                const dayKey = getDateKey(day);
                const isToday = dayKey === todayKey;
                const dayCards = cardsByDate.get(dayKey) || [];
                const isAdding = addingOnDay === dayKey;

                return (
                  <div
                    key={dayKey}
                    className={`flex flex-col rounded-xl border p-2.5 transition ${
                      isToday
                        ? 'border-blue-500/60 bg-blue-950/20 ring-1 ring-blue-500/30'
                        : 'border-white/10 bg-zinc-900/40 hover:border-white/20'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-xs font-semibold ${
                            isToday ? 'text-blue-400 font-bold' : 'text-white/60'
                          }`}
                        >
                          {day.toLocaleDateString('default', { weekday: 'short' })}
                        </span>
                        <span
                          className={`flex items-center justify-center text-sm font-bold rounded-full ${
                            isToday
                              ? 'h-6 w-6 bg-[#0052cc] text-white shadow'
                              : 'text-white/90'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAddingOnDay(isAdding ? null : dayKey);
                          setNewCardTitle('');
                        }}
                        className="rounded p-1 text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Add card on this day"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Inline Add Card Input */}
                    {isAdding && (
                      <div className="mb-2 p-2 rounded-lg bg-zinc-800 border border-blue-500/50 shadow-lg space-y-2 animate-in fade-in">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Card title..."
                          value={newCardTitle}
                          onChange={(e) => setNewCardTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmAddCard(day);
                            if (e.key === 'Escape') setAddingOnDay(null);
                          }}
                          className="w-full rounded bg-zinc-900 border border-white/10 px-2 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                        />
                        {columns.length > 1 && (
                          <select
                            value={selectedListId}
                            onChange={(e) => setSelectedListId(e.target.value)}
                            className="w-full rounded bg-zinc-900 border border-white/10 px-2 py-1 text-[11px] text-white/80 focus:outline-none"
                          >
                            {columns.map((c) => (
                              <option key={c.id} value={c.id}>
                                List: {c.title}
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAddingOnDay(null)}
                            className="rounded px-2 py-0.5 text-[11px] text-white/60 hover:text-white transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmAddCard(day)}
                            className="rounded bg-[#0052cc] hover:bg-blue-600 px-2.5 py-0.5 text-[11px] font-semibold text-white transition cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Day Cards List */}
                    <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                      {dayCards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => onCardClick(card, card.columnTitle)}
                          className="group relative rounded-lg border border-white/10 bg-zinc-800/80 hover:bg-zinc-800 p-2.5 shadow-sm hover:shadow-md cursor-pointer transition hover:border-white/20"
                        >
                          {/* List Badge */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="inline-block rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/70">
                              {card.columnTitle}
                            </span>
                            {onToggleCardCompletion ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleCardCompletion(card.id, !card.completed);
                                }}
                                className={`flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded transition ${
                                  card.completed
                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80'
                                }`}
                                title={card.completed ? 'Mark as incomplete' : 'Mark as completed'}
                              >
                                <Check className="h-3 w-3" />
                                {card.completed && <span>Done</span>}
                              </button>
                            ) : card.completed ? (
                              <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400">
                                <Check className="h-3 w-3" /> Done
                              </span>
                            ) : null}
                          </div>

                          {/* Card Title */}
                          <p
                            className={`text-xs font-medium leading-snug ${
                              card.completed ? 'text-white/50 line-through' : 'text-white'
                            }`}
                          >
                            {card.title}
                          </p>

                          {/* Metadata Indicators */}
                          {(card.checklist || (card.tags && card.tags.length > 0)) && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-white/5 text-[10px] text-white/50">
                              {card.checklist && (
                                <div className="flex items-center gap-1">
                                  <CheckSquare className="h-3 w-3" />
                                  <span>
                                    {card.checklist.current}/{card.checklist.total}
                                  </span>
                                </div>
                              )}
                              {card.tags?.map((t) => (
                                <span
                                  key={t.id}
                                  className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${t.colorClass}`}
                                >
                                  {t.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {dayCards.length === 0 && !isAdding && (
                        <div
                          onClick={() => {
                            setAddingOnDay(dayKey);
                            setNewCardTitle('');
                          }}
                          className="h-full min-h-[80px] flex flex-col items-center justify-center rounded-lg border border-dashed border-white/5 hover:border-white/20 text-white/20 hover:text-white/60 transition cursor-pointer p-2 text-center"
                        >
                          <Plus className="h-4 w-4 mb-1" />
                          <span className="text-[10px]">Add card</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= MONTH VIEW ================= */
            <div className="flex flex-col rounded-2xl border border-white/10 bg-zinc-900/40 overflow-hidden min-h-[640px]">
              {/* Day Headers (Mon - Sun) */}
              <div className="grid grid-cols-7 border-b border-white/10 bg-black/40 text-center py-2 text-xs font-bold text-white/60">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {monthDays.map(({ date, isCurrentMonth }, idx) => {
                  const dayKey = getDateKey(date);
                  const isToday = dayKey === todayKey;
                  const dayCards = cardsByDate.get(dayKey) || [];

                  return (
                    <div
                      key={idx}
                      className={`min-h-[110px] p-1.5 border-b border-r border-white/5 flex flex-col transition ${
                        !isCurrentMonth
                          ? 'bg-black/40 opacity-40'
                          : isToday
                          ? 'bg-blue-950/20'
                          : 'bg-transparent hover:bg-white/5'
                      }`}
                    >
                      {/* Day Number */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold rounded-full flex items-center justify-center ${
                            isToday
                              ? 'h-5 w-5 bg-[#0052cc] text-white shadow'
                              : isCurrentMonth
                              ? 'text-white/80'
                              : 'text-white/40'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {dayCards.length > 0 && (
                          <span className="text-[10px] text-white/40 font-semibold">
                            {dayCards.length}
                          </span>
                        )}
                      </div>

                      {/* Cards list in month cell */}
                      <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                        {dayCards.slice(0, 3).map((card) => (
                          <div
                            key={card.id}
                            onClick={() => onCardClick(card, card.columnTitle)}
                            className="rounded bg-zinc-800/90 hover:bg-zinc-700 border border-white/10 px-1.5 py-1 text-[10px] font-medium text-white truncate cursor-pointer transition flex items-center gap-1"
                            title={card.title}
                          >
                            {card.completed ? (
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Clock className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                            )}
                            <span className={`truncate ${card.completed ? 'line-through text-white/50' : ''}`}>
                              {card.title}
                            </span>
                          </div>
                        ))}
                        {dayCards.length > 3 && (
                          <div className="text-[10px] text-blue-400 font-semibold px-1">
                            +{dayCards.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Unscheduled Cards Collapsible Side Tray */}
        {isUnscheduledOpen && (
          <aside className="w-80 border-l border-white/10 bg-zinc-900/95 backdrop-blur-xl flex flex-col p-4 space-y-3 z-20 animate-in slide-in-from-right duration-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Unscheduled ({unscheduledCards.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUnscheduledOpen(false)}
                className="rounded p-1 text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[11px] text-white/50">
              Cards on this board with no due date. Click any card to schedule or assign it.
            </p>

            {/* Filter Search */}
            <input
              type="text"
              placeholder="Filter unscheduled..."
              value={unscheduledSearch}
              onChange={(e) => setUnscheduledSearch(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition"
            />

            {/* Unscheduled List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredUnscheduled.map((card) => (
                <div
                  key={card.id}
                  className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-3 space-y-2 transition shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/70">
                      {card.columnTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCardClick(card, card.columnTitle)}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Open
                    </button>
                  </div>

                  <p className="text-xs font-medium text-white">{card.title}</p>

                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateCardDueDate) {
                        const todayFormatted = new Date().toLocaleDateString();
                        onUpdateCardDueDate(card.id, todayFormatted);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 py-1 text-[11px] font-semibold transition cursor-pointer"
                  >
                    <Clock className="h-3 w-3" />
                    <span>Set Due Today</span>
                  </button>
                </div>
              ))}

              {filteredUnscheduled.length === 0 && (
                <div className="py-12 text-center text-xs text-white/40 italic">
                  No unscheduled cards found
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default BoardPlannerView;
