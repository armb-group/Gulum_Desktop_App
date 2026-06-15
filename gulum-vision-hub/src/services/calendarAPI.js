import api from './api';

const extractTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '12:00 PM';
  }
};

const statusToCategory = (status) => {
  switch ((status ?? '').toUpperCase()) {
    case 'COMPLETED': return 'class';
    case 'CANCELLED': return 'holiday';
    default:          return 'activity';
  }
};

const normalise = (e) => ({
  id:          e.id ?? String(Math.random()),
  title:       e.title,
  date:        new Date(e.eventDate),
  time:        extractTime(e.eventDate),
  location:    e.location,
  description: e.description,
  category:    statusToCategory(e.status),
  status:      e.status ?? 'UPCOMING',
});

export const fetchCalendarEvents = async (_role) => {
  const res = await api.get('/event/all');
  const raw = Array.isArray(res.data)
    ? res.data
    : Array.isArray(res.data?.data)   ? res.data.data
    : Array.isArray(res.data?.events) ? res.data.events
    : [];
  return raw.map(normalise);
};

export const addCalendarEvent = async (payload) => {
  const res = await api.post('/event/add', payload);
  const raw =
    res.data?.id        ? res.data :
    res.data?.data?.id  ? res.data.data :
    res.data?.event?.id ? res.data.event :
    { ...payload, id: `local-${Date.now()}` };
  return normalise(raw);
};

export const fetchEventsByDate = async (role, date) => {
  const all = await fetchCalendarEvents(role);
  return all.filter(e => {
    const d = new Date(e.date);
    return d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear();
  });
};

export const fetchEventsByMonth = async (role, year, month) => {
  const all = await fetchCalendarEvents(role);
  return all.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
};
