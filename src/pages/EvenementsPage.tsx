import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Evenement {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  attendees_count: number;
  created_at: string;
}

export default function EvenementsPage() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvenements();
  }, []);

  const loadEvenements = async () => {
    const { data, error } = await supabase
      .from('evenements')
      .select('*')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (!error && data) {
      setEvenements(data);
    }
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Événements</h1>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : evenements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun événement à venir</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {evenements.map((evenement) => (
            <div
              key={evenement.id}
              className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0">
                  <span className="text-xs font-medium">
                    {new Date(evenement.start_date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                  </span>
                  <span className="text-2xl font-bold">
                    {new Date(evenement.start_date).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{evenement.title}</h3>
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{formatDate(evenement.start_date)}</span>
                    </div>
                    {evenement.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{evenement.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>{evenement.attendees_count} participant{evenement.attendees_count > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  {evenement.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{evenement.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
