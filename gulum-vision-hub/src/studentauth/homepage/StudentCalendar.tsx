import { useState, useEffect, useMemo } from 'react';
import { RoleShell } from '@/components/RoleShell';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { CalendarEvent, calculateEventStats, EventCategory } from '@/lib/calendarUtils';
import { QuickStatsCards } from '@/components/calendar/QuickStatsCards';
import { EventList } from '@/components/calendar/EventList';
import { CalendarPanel } from '@/components/calendar/CalendarPanel';
import { EventFilterBar } from '@/components/calendar/EventFilterBar';
import { toast } from 'sonner';
import api from '@/services/api';

interface ApiEvent {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  status?: string;
}

const toEvent = (e: ApiEvent): CalendarEvent => ({
  id: e.id,
  title: e.title,
  description: e.description,
  date: new Date(e.eventDate),
  time: new Date(e.eventDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  location: e.location,
  category: 'activity',
  status: e.status ?? 'UPCOMING',
});

const StudentCalendar = () => {
  const [events, setEvents]   = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery]   = useState('');
  const [selCats, setSelCats] = useState<Set<EventCategory>>(new Set());

  const load = async () => {
  setLoading(true);
  setError(false);

  try {
    const res = await api.get('/event/all');

    const raw: ApiEvent[] = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)         ? res.data.data
      : Array.isArray(res.data?.responseData) ? res.data.responseData
      : [];

    setEvents(raw.map(toEvent));
  } catch {
    setError(true);
    toast.error('Failed to load events.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { load(); }, []);

  const stats = calculateEventStats(events);
  const availCats = useMemo(() => Array.from(new Set(events.map(e => e.category))), [events]);
  const filtered = useMemo(() => events.filter(ev =>
    (searchQuery === '' ||
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selCats.size === 0 || selCats.has(ev.category))
  ), [events, searchQuery, selCats]);

  const toggleCat = (c: EventCategory) => {
  setSelCats((prev: Set<EventCategory>) => {
    const n = new Set<EventCategory>(prev);

    if (n.has(c)) {
      n.delete(c);
    } else {
      n.add(c);
    }

    return n;
  });
};

  return (
    <RoleShell role="student" title="Calendar" wide>
      {/* LEFT scrolls · RIGHT is height-locked — both inline styles for certainty */}
      <div style={{ display: 'flex', width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading
              ? [0, 1].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)
              : <QuickStatsCards stats={stats} />
            }
            {!loading && (
              <EventFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategories={selCats}
                onCategoryToggle={toggleCat}
                availableCategories={availCats}
              />
            )}
            {loading
              ? [0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)
              : error
              ? (
                <Card className="p-10 text-center rounded-2xl border border-destructive/20 bg-destructive/5">
                  <p className="font-semibold text-destructive mb-2">Could not load events</p>
                  <p className="text-sm text-muted-foreground mb-4">Make sure the backend is running on port 8080.</p>
                  <button onClick={load} className="text-sm font-semibold text-primary hover:underline">Retry</button>
                </Card>
              )
              : <EventList events={filtered} selectedDate={selectedDate} />
            }
          </div>
        </div>

        {/* RIGHT — fixed, CalendarPanel scrolls internally */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden',
          borderLeft: '1px solid hsl(var(--border))',
          background: 'hsl(var(--background))',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <CalendarPanel
            events={events}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>

      </div>
    </RoleShell>
  );
};

export default StudentCalendar;
