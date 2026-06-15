import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { CalendarEvent } from '@/lib/calendarUtils';
import { addCalendarEvent, AddEventPayload } from '@/services/calendarAPI';
import { toast } from 'sonner';

interface AddEventModalProps {
  onEventAdd?: (event: CalendarEvent) => void;
}

const STATUSES = [
  { value: 'UPCOMING',  label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const EMPTY = {
  title: '',
  description: '',
  date: '',           // "YYYY-MM-DD"  from date input
  time: '10:00',      // "HH:mm"       from time input
  location: '',
  reminderBeforeHours: '24',
  status: 'UPCOMING',
};

export const AddEventModal = ({ onEventAdd }: AddEventModalProps) => {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState(EMPTY);

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) {
      toast.error('Title and date are required.');
      return;
    }

    // Build ISO datetime: "2026-06-15T10:00:00"
    const eventDate = `${form.date}T${form.time || '00:00'}:00`;

    const payload: AddEventPayload = {
      title:               form.title.trim(),
      description:         form.description.trim() || undefined,
      eventDate,
      location:            form.location.trim() || undefined,
      reminderBeforeHours: Number(form.reminderBeforeHours) || 24,
      status:              form.status,
    };

    setLoading(true);
    try {
      const created = await addCalendarEvent(payload);
      toast.success('Event created successfully!');
      onEventAdd?.(created);
      setForm(EMPTY);
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 h-9 rounded-xl text-sm font-semibold">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Create New Event</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add an event to the institution calendar. Visible to all roles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-title" className="text-sm font-medium">
              Event Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ev-title"
              placeholder="e.g., Annual Sports Day"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="h-10 rounded-xl"
              required
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-date" className="text-sm font-medium">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ev-date"
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="h-10 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-time" className="text-sm font-medium">Time</Label>
              <Input
                id="ev-time"
                type="time"
                value={form.time}
                onChange={e => set('time', e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-location" className="text-sm font-medium">Location</Label>
            <Input
              id="ev-location"
              placeholder="e.g., Main Auditorium"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-desc" className="text-sm font-medium">Description</Label>
            <Input
              id="ev-desc"
              placeholder="Optional details"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>

          {/* Reminder */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-reminder" className="text-sm font-medium">
              Reminder (hours before)
            </Label>
            <Input
              id="ev-reminder"
              type="number"
              min={0}
              value={form.reminderBeforeHours}
              onChange={e => set('reminderBeforeHours', e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 h-10 rounded-xl"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 rounded-xl font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
