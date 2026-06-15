import { Card } from '@/components/ui/card';
import { CalendarEvent, formatDateLong } from '@/lib/calendarUtils';
import { Calendar, Clock, MapPin, CheckCircle2, Circle, XCircle } from 'lucide-react';

interface EventCardProps {
  event: CalendarEvent;
}

const statusConfig = (status?: string) => {
  switch ((status ?? '').toUpperCase()) {
    case 'COMPLETED':
      return {
        bar: 'bg-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: CheckCircle2,
        label: 'Completed',
      };
    case 'CANCELLED':
      return {
        bar: 'bg-red-500',
        badge: 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20',
        icon: XCircle,
        label: 'Cancelled',
      };
    default:
      return {
        bar: 'bg-blue-500',
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: Circle,
        label: 'Upcoming',
      };
  }
};

export const EventCard = ({ event }: EventCardProps) => {
  const cfg = statusConfig(typeof event.status === 'string' ? event.status : undefined);
  const StatusIcon = cfg.icon;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar} rounded-l-2xl`} />

      <div className="pl-5 pr-4 py-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-foreground leading-snug flex-1 min-w-0 text-sm group-hover:text-primary transition-colors duration-150">
            {event.title}
          </h3>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cfg.badge}`}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>

        {/* Meta info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/60" />
            <span>{formatDateLong(event.date)}</span>
          </div>

          {event.time && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span>{event.time}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {event.description}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
