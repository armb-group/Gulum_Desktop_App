import { Card } from '@/components/ui/card';
import { EventQuickStats } from '@/lib/calendarUtils';
import { CalendarDays, Sparkles, TrendingUp } from 'lucide-react';

interface QuickStatsCardsProps {
  stats: EventQuickStats;
}

export const QuickStatsCards = ({ stats }: QuickStatsCardsProps) => {
  const total = Object.values(stats.categoryBreakdown).reduce((a, b) => a + b, 0);

  const items = [
    {
      label: "Today's Events",
      value: stats.todayEvents,
      icon: CalendarDays,
      accent: 'from-blue-500 to-cyan-500',
      soft: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'This Month',
      value: stats.upcomingEvents,
      icon: TrendingUp,
      accent: 'from-violet-500 to-purple-500',
      soft: 'bg-violet-500/10 border-violet-500/20',
      text: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Total Events',
      value: total,
      icon: Sparkles,
      accent: 'from-primary to-primary/70',
      soft: 'bg-primary/10 border-primary/20',
      text: 'text-primary',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground shadow-lg shadow-primary/20">
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">Institution Calendar</p>
          <p className="text-2xl font-bold leading-tight">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm opacity-70 mt-1">{new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <Card key={item.label} className={`p-3.5 border rounded-2xl ${item.soft} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
            <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center mb-2.5 shadow-sm`}>
              <item.icon className="h-4 w-4 text-white" />
            </div>
            <p className={`text-2xl font-bold tabular-nums ${item.text}`}>{item.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-tight">{item.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
