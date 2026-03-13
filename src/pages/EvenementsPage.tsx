import { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  Clock,
  Users,
  Tag,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Commune {
  id: string;
  name: string;
}

interface Evenement {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  commune_id: string | null;
  category: string | null;
  start_date: string;
  end_date: string | null;
  attendees_count: number;
  max_attendees: number | null;
  communes?: Commune | null;
}

type ViewMode = 'agenda' | 'mois';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  culture:       { label: 'Culture',       color: 'text-blue-700',   bg: 'bg-blue-100 border-blue-200' },
  sport:         { label: 'Sport',          color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200' },
  marche:        { label: 'Marché',         color: 'text-amber-700',  bg: 'bg-amber-100 border-amber-200' },
  fete:          { label: 'Fête',           color: 'text-rose-700',   bg: 'bg-rose-100 border-rose-200' },
  atelier:       { label: 'Atelier',        color: 'text-violet-700', bg: 'bg-violet-100 border-violet-200' },
  social:        { label: 'Social',         color: 'text-pink-700',   bg: 'bg-pink-100 border-pink-200' },
  institutionnel:{ label: 'Institutionnel', color: 'text-slate-700',  bg: 'bg-slate-100 border-slate-200' },
  education:     { label: 'Éducation',      color: 'text-cyan-700',   bg: 'bg-cyan-100 border-cyan-200' },
};

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAY_NAMES_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const DAY_NAMES_FULL = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

function getCategoryConfig(cat: string | null) {
  return CATEGORY_CONFIG[cat ?? ''] ?? { label: cat ?? 'Autre', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' };
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateFull(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(d: Date) {
  return isSameDay(d, new Date());
}

function groupByDay(events: Evenement[]): Map<string, Evenement[]> {
  const map = new Map<string, Evenement[]>();
  for (const e of events) {
    const key = new Date(e.start_date).toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return map;
}

function EventCard({ event, onClick }: { event: Evenement; onClick: () => void }) {
  const cat = getCategoryConfig(event.category);
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-4 group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cat.bg} ${cat.color}`}>
              {cat.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors truncate pr-2">
            {event.title}
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {formatTime(event.start_date)}
              {event.end_date && ` – ${formatTime(event.end_date)}`}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[160px]">{event.location}</span>
              </span>
            )}
            {event.communes && (
              <span className="flex items-center gap-1 text-xs text-cyan-600 font-medium">
                {event.communes.name}
              </span>
            )}
          </div>
        </div>
        {event.max_attendees && (
          <div className="flex-shrink-0 text-right">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              {event.max_attendees}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function EventModal({ event, onClose }: { event: Evenement; onClose: () => void }) {
  const cat = getCategoryConfig(event.category);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cat.bg} ${cat.color} mb-2`}>
                <Tag className="w-3 h-3" />
                {cat.label}
              </span>
              <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800 capitalize">{formatDateFull(event.start_date)}</p>
                <p className="text-sm text-gray-500">
                  {formatTime(event.start_date)}
                  {event.end_date && ` → ${formatTime(event.end_date)}`}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{event.location}</p>
                  {event.communes && (
                    <p className="text-sm text-cyan-600">{event.communes.name}</p>
                  )}
                </div>
              </div>
            )}

            {event.max_attendees && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Users className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{event.attendees_count}</span> / {event.max_attendees} participants
                </p>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AgendaView({ events, onSelect }: { events: Evenement[]; onSelect: (e: Evenement) => void }) {
  const grouped = groupByDay(events);
  const sortedKeys = Array.from(grouped.keys()).sort();

  if (sortedKeys.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Aucun événement sur cette période</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedKeys.map((key) => {
        const date = new Date(key + 'T00:00:00');
        const dayIdx = (date.getDay() + 6) % 7;
        const today = isToday(date);
        const dayEvents = grouped.get(key)!;

        return (
          <div key={key}>
            <div className={`flex items-center gap-3 mb-3`}>
              <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl font-bold text-sm flex-shrink-0 ${today ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-200' : 'bg-white border border-gray-200 text-gray-700'}`}>
                <span className="text-xs font-medium leading-none">{DAY_NAMES_SHORT[dayIdx]}</span>
                <span className="text-xl leading-tight">{date.getDate()}</span>
              </div>
              <div>
                <p className={`font-semibold capitalize ${today ? 'text-cyan-600' : 'text-gray-800'}`}>
                  {DAY_NAMES_FULL[dayIdx]} {date.getDate()} {MONTH_NAMES[date.getMonth()]}
                  {today && <span className="ml-2 text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">Aujourd'hui</span>}
                </p>
                <p className="text-xs text-gray-400">{dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="space-y-2 ml-15 pl-4 border-l-2 border-gray-100">
              {dayEvents.map((e) => (
                <EventCard key={e.id} event={e} onClick={() => onSelect(e)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ year, month, events, onSelect, onDayClick }: {
  year: number;
  month: number;
  events: Evenement[];
  onSelect: (e: Evenement) => void;
  onDayClick: (date: Date) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const eventsByDay: Record<number, Evenement[]> = {};
  for (const e of events) {
    const d = new Date(e.start_date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(e);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES_SHORT.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - startOffset + 1;
          const isValid = dayNum >= 1 && dayNum <= lastDay.getDate();
          const cellDate = isValid ? new Date(year, month, dayNum) : null;
          const todayCell = cellDate ? isToday(cellDate) : false;
          const dayEvents = isValid ? (eventsByDay[dayNum] ?? []) : [];

          return (
            <div
              key={i}
              onClick={() => cellDate && onDayClick(cellDate)}
              className={`min-h-[72px] p-1.5 border-b border-r border-gray-50 last:border-r-0 ${isValid ? 'cursor-pointer hover:bg-gray-50 transition-colors' : 'bg-gray-50/30'}`}
            >
              {isValid && (
                <>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${todayCell ? 'bg-cyan-500 text-white' : 'text-gray-700'}`}>
                    {dayNum}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => {
                      const cat = getCategoryConfig(e.category);
                      return (
                        <button
                          key={e.id}
                          onClick={(ev) => { ev.stopPropagation(); onSelect(e); }}
                          className={`w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate border ${cat.bg} ${cat.color} hover:opacity-80 transition-opacity`}
                        >
                          {e.title}
                        </button>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <p className="text-xs text-gray-400 px-1">+{dayEvents.length - 2} autre{dayEvents.length - 2 > 1 ? 's' : ''}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EvenementsPage() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [selectedEvent, setSelectedEvent] = useState<Evenement | null>(null);
  const [filterCommune, setFilterCommune] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [agendaWeeksAhead, setAgendaWeeksAhead] = useState(4);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [evResp, commResp] = await Promise.all([
      supabase
        .from('evenements')
        .select('*, communes(id, name)')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true }),
      supabase.from('communes').select('id, name').order('name'),
    ]);

    if (!evResp.error && evResp.data) setEvenements(evResp.data as Evenement[]);
    if (!commResp.error && commResp.data) setCommunes(commResp.data);
    setLoading(false);
  };

  const filteredEvents = evenements.filter((e) => {
    if (filterCommune !== 'all' && e.commune_id !== filterCommune) return false;
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    return true;
  });

  const agendaEvents = filteredEvents.filter((e) => {
    const d = new Date(e.start_date);
    const limit = new Date();
    limit.setDate(limit.getDate() + agendaWeeksAhead * 7);
    return d <= limit;
  });

  const monthEvents = filteredEvents.filter((e) => {
    const d = new Date(e.start_date);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  });

  const usedCategories = [...new Set(evenements.map((e) => e.category).filter(Boolean))] as string[];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDayClick = (date: Date) => {
    const dayEvents = filteredEvents.filter((e) => isSameDay(new Date(e.start_date), date));
    if (dayEvents.length === 1) setSelectedEvent(dayEvents[0]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-0.5">Événements des 44 communes du Gard Rhodanien</p>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'agenda' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Agenda</span>
          </button>
          <button
            onClick={() => setViewMode('mois')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'mois' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Mois</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filterCommune}
          onChange={(e) => setFilterCommune(e.target.value)}
          className="flex-1 min-w-[160px] max-w-[220px] text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
        >
          <option value="all">Toutes les communes</option>
          {communes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex-1 min-w-[140px] max-w-[180px] text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
        >
          <option value="all">Toutes catégories</option>
          {usedCategories.map((cat) => (
            <option key={cat} value={cat}>{getCategoryConfig(cat).label}</option>
          ))}
        </select>
        {(filterCommune !== 'all' || filterCategory !== 'all') && (
          <button
            onClick={() => { setFilterCommune('all'); setFilterCategory('all'); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        )}
      </div>

      {viewMode === 'mois' && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <p className="font-bold text-gray-900 capitalize">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </p>
            <p className="text-xs text-gray-400">{monthEvents.length} événement{monthEvents.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'agenda' ? (
        <>
          <AgendaView events={agendaEvents} onSelect={setSelectedEvent} />
          {agendaEvents.length < filteredEvents.length && (
            <div className="text-center pt-2">
              <button
                onClick={() => setAgendaWeeksAhead((w) => w + 4)}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                Voir plus d'événements
              </button>
            </div>
          )}
        </>
      ) : (
        <MonthView
          year={currentDate.getFullYear()}
          month={currentDate.getMonth()}
          events={monthEvents}
          onSelect={setSelectedEvent}
          onDayClick={handleDayClick}
        />
      )}

      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
