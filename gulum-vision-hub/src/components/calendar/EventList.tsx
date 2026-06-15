import { CalendarEvent, sortEventsByDate, getEventsForDate, formatDateShort, isToday } from '@/lib/calendarUtils';
import { EventCard } from './EventCard';
import { CalendarX } from 'lucide-react';

interface EventListProps {
  events: CalendarEvent[];
  selectedDate: Date | null;
}

const isDateToday = (dateKey: string): boolean => {
  return dateKey === formatDateShort(new Date());
};

const isTomorrow = (dateKey: string): boolean => {
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return dateKey === formatDateShort(tom);
};

const getDateLabel = (dateKey: string): string => {
  if (isDateToday(dateKey)) return `Today — ${dateKey}`;
  if (isTomorrow(dateKey)) return `Tomorrow — ${dateKey}`;
  return dateKey;
};

export const EventList = ({ events, selectedDate }: EventListProps) => {
  let displayedEvents: CalendarEvent[];

  if (selectedDate) {
    const selectedDateEvents = getEventsForDate(events, selectedDate);
    const otherEvents = sortEventsByDate(
      events.filter(e => !selectedDateEvents.find(se => se.id === e.id))
    );
    displayedEvents = [...selectedDateEvents, ...otherEvents];
  } else {
    displayedEvents = sortEventsByDate(events);
  }

  // Group by date
  const groupedEvents: Record<string, CalendarEvent[]> = {};
  displayedEvents.forEach(event => {
    const key = formatDateShort(event.date);
    if (!groupedEvents[key]) groupedEvents[key] = [];
    groupedEvents[key].push(event);
  });

  if (displayedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center">
          <CalendarX className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">No events found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedDate ? 'No events scheduled for this date.' : 'No upcoming events in the calendar.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => {
        const highlight = isDateToday(dateKey);
        return (
          <div key={dateKey}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                highlight
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                  : 'bg-muted/60 text-muted-foreground border-border/40'
              }`}>
                {getDateLabel(dateKey)}
              </div>
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-xs text-muted-foreground shrink-0">
                {dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Event cards */}
            <div className="space-y-2.5">
              {dateEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
