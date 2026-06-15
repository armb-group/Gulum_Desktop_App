import { Card } from '@/components/ui/card';
import {
  CalendarEvent, getDaysInMonth, getFirstDayOfMonth,
  getMonthName, getEventsForDate, isSameDay,
} from '@/lib/calendarUtils';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

interface CalendarPanelProps {
  events: CalendarEvent[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
}

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const statusDotColor = (status?: string) => {
  switch ((status ?? '').toUpperCase()) {
    case 'COMPLETED': return '#10b981';
    case 'CANCELLED': return '#ef4444';
    default:          return '#3b82f6';
  }
};

export const CalendarPanel = ({
  events, selectedDate, onDateSelect, currentMonth, onMonthChange,
}: CalendarPanelProps) => {
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth     = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

  const getEventsForDay = (day: number) =>
    getEventsForDate(events, new Date(year, month, day));

  const selectedEvents = selectedDate ? getEventsForDate(events, selectedDate) : [];

  return (
    /* Full-height flex column: fixed top (mini calendar) + scrollable bottom */
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* ── FIXED TOP: Mini Calendar ── */}
      <div style={{ flexShrink: 0 }}>
        <Card className="overflow-hidden border border-border/50 rounded-2xl shadow-sm">
          {/* Month header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
            <button
              onClick={() => onMonthChange(new Date(year, month - 1))}
              className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-bold text-foreground">
              {getMonthName(month)} {year}
            </span>
            <button
              onClick={() => onMonthChange(new Date(year, month + 1))}
              className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-3">
            {/* Day name headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateObj    = new Date(year, month, day);
                const dayEvents  = getEventsForDay(day);
                const isTodayDay = isThisMonth && today.getDate() === day;
                const isSelected = selectedDate ? isSameDay(dateObj, selectedDate) : false;
                const hasEvents  = dayEvents.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => onDateSelect(dateObj)}
                    className={`
                      relative flex flex-col items-center justify-center rounded-xl py-1.5 text-xs font-medium
                      transition-all duration-150
                      ${isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                        : isTodayDay
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'hover:bg-muted text-foreground'
                      }
                    `}
                  >
                    <span>{day}</span>
                    {hasEvents && !isSelected && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((ev, idx) => (
                          <div
                            key={idx}
                            className="h-1 w-1 rounded-full"
                            style={{ backgroundColor: statusDotColor(typeof ev.status === 'string' ? ev.status : undefined) }}
                          />
                        ))}
                      </div>
                    )}
                    {hasEvents && isSelected && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((_, idx) => (
                          <div key={idx} className="h-1 w-1 rounded-full bg-primary-foreground/60" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today quick-jump */}
          <div className="px-3 pb-3">
            <button
              onClick={() => { onDateSelect(new Date()); onMonthChange(new Date()); }}
              className="w-full text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl py-1.5 transition-colors"
            >
              Jump to Today
            </button>
          </div>
        </Card>
      </div>

      {/* ── SCROLLABLE BOTTOM: Selected date preview + Event summary ── */}
      <div style={{ flex: 1, overflowY: 'auto', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Selected Date Preview */}
        {selectedDate && (
          <Card className="overflow-hidden border border-border/50 rounded-2xl shadow-sm">
            <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
            {selectedEvents.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No events on this day</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {selectedEvents.map(ev => (
                  <div key={ev.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div
                        className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: statusDotColor(typeof ev.status === 'string' ? ev.status : undefined) }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{ev.title}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {ev.time && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" /> {ev.time}
                            </span>
                          )}
                          {ev.location && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                              <MapPin className="h-3 w-3 shrink-0" /> {ev.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Event Summary */}
        {events.length > 0 && (
          <Card className="border border-border/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Event Summary</p>
            </div>
            <div className="divide-y divide-border/30">
              {[
                { label: 'Upcoming',  color: 'bg-blue-500',    filter: 'UPCOMING'  },
                { label: 'Completed', color: 'bg-emerald-500', filter: 'COMPLETED' },
                { label: 'Cancelled', color: 'bg-red-500',     filter: 'CANCELLED' },
              ].map(({ label, color, filter }) => {
                const count = events.filter(e =>
                  (typeof e.status === 'string' ? e.status : '').toUpperCase() === filter
                ).length;
                if (count === 0) return null;
                return (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${color}`} />
                      <span className="text-sm text-foreground font-medium">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
