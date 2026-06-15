import { Input } from '@/components/ui/input';
import { EventCategory } from '@/lib/calendarUtils';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface EventFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategories: Set<EventCategory>;
  onCategoryToggle: (c: EventCategory) => void;
  availableCategories: EventCategory[];
}

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
  activity: { label: 'Upcoming',  dot: 'bg-blue-500' },
  class:    { label: 'Completed', dot: 'bg-emerald-500' },
  holiday:  { label: 'Cancelled', dot: 'bg-red-500' },
};

export const EventFilterBar = ({
  searchQuery, onSearchChange,
  selectedCategories, onCategoryToggle,
  availableCategories,
}: EventFilterBarProps) => {
  const hasFilters = selectedCategories.size > 0 || searchQuery !== '';

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search events by title or description…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="h-10 pl-10 pr-10 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-2 focus-visible:ring-primary/25"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter pills row */}
      {availableCategories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="font-medium">Filter:</span>
          </div>
          {availableCategories.map(cat => {
            const meta = STATUS_MAP[cat] ?? { label: cat, dot: 'bg-primary' };
            const active = selectedCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => onCategoryToggle(cat)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-primary-foreground' : meta.dot}`} />
                {meta.label}
              </button>
            );
          })}
          {hasFilters && (
            <button
              onClick={() => { onSearchChange(''); selectedCategories.forEach(c => onCategoryToggle(c)); }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium ml-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-border/40" />
    </div>
  );
};
