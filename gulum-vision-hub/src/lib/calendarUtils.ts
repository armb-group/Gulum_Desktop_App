export type EventCategory = 'exam' | 'holiday' | 'meeting' | 'assignment' | 'workshop' | 'seminar' | 'sports' | 'class' | 'duty' | 'activity';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date | string;
  time: string;
  location?: string;
  description?: string;
  category: EventCategory;
  status?: 'completed' | 'upcoming' | 'cancelled' | string;
  roleType?: 'student' | 'teacher';
}

export interface EventQuickStats {
  todayEvents: number;
  upcomingEvents: number;
  categoryBreakdown: Record<EventCategory, number>;
}

export const getCategoryColor = (category: EventCategory): string => {
  const colors: Record<EventCategory, string> = {
    exam: '#EF4444',      // Red
    holiday: '#22C55E',   // Green
    meeting: '#3B82F6',   // Blue
    assignment: '#F97316', // Orange
    workshop: '#A855F7',  // Purple
    seminar: '#06B6D4',   // Cyan
    sports: '#EC4899',    // Pink
    class: '#8B5CF6',     // Indigo
    duty: '#F59E0B',      // Amber
    activity: '#14B8A6',  // Teal
  };
  return colors[category];
};

export const getCategoryBgColor = (category: EventCategory): string => {
  const bgColors: Record<EventCategory, string> = {
    exam: 'bg-red-100 dark:bg-red-950',
    holiday: 'bg-green-100 dark:bg-green-950',
    meeting: 'bg-blue-100 dark:bg-blue-950',
    assignment: 'bg-orange-100 dark:bg-orange-950',
    workshop: 'bg-purple-100 dark:bg-purple-950',
    seminar: 'bg-cyan-100 dark:bg-cyan-950',
    sports: 'bg-pink-100 dark:bg-pink-950',
    class: 'bg-indigo-100 dark:bg-indigo-950',
    duty: 'bg-amber-100 dark:bg-amber-950',
    activity: 'bg-teal-100 dark:bg-teal-950',
  };
  return bgColors[category];
};

export const getCategoryTextColor = (category: EventCategory): string => {
  const textColors: Record<EventCategory, string> = {
    exam: 'text-red-700 dark:text-red-200',
    holiday: 'text-green-700 dark:text-green-200',
    meeting: 'text-blue-700 dark:text-blue-200',
    assignment: 'text-orange-700 dark:text-orange-200',
    workshop: 'text-purple-700 dark:text-purple-200',
    seminar: 'text-cyan-700 dark:text-cyan-200',
    sports: 'text-pink-700 dark:text-pink-200',
    class: 'text-indigo-700 dark:text-indigo-200',
    duty: 'text-amber-700 dark:text-amber-200',
    activity: 'text-teal-700 dark:text-teal-200',
  };
  return textColors[category];
};

export const formatDateShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateLong = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

export const getDateOnly = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = getDateOnly(date1);
  const d2 = getDateOnly(date2);
  return d1.getTime() === d2.getTime();
};

export const isToday = (date: Date | string): boolean => {
  return isSameDay(date, new Date());
};

export const sortEventsByDate = (events: CalendarEvent[]): CalendarEvent[] => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return a.time.localeCompare(b.time);
  });
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

export const getMonthName = (month: number): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month];
};

export const getEventsForDate = (events: CalendarEvent[], date: Date | string): CalendarEvent[] => {
  return events.filter(event => isSameDay(event.date, date));
};

export const getUpcomingEvents = (events: CalendarEvent[], daysAhead: number = 30): CalendarEvent[] => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today && eventDate <= futureDate;
  });
};

export const calculateEventStats = (events: CalendarEvent[]): EventQuickStats => {
  const today = new Date();
  const todayEvents = events.filter(e => isToday(e.date)).length;

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const thisMonthEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate >= monthStart && eventDate <= monthEnd;
  }).length;

  const categoryBreakdown: Record<EventCategory, number> = {
    exam: 0, holiday: 0, meeting: 0, assignment: 0, workshop: 0,
    seminar: 0, sports: 0, class: 0, duty: 0, activity: 0,
  };

  events.forEach(e => categoryBreakdown[e.category]++);

  return {
    todayEvents,
    upcomingEvents: thisMonthEvents,
    categoryBreakdown,
  };
};
