import { useState, useEffect } from 'react';
import { Users, Plus, X, Check, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';

interface Salon {
  id: string;
  name: string;
  description: string | null;
  members_count: number;
  is_approved: boolean;
  created_at: string;
  created_by: string;
}

export default function SalonsPage() {
  const { user } = useApp();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSalon, setShowNewSalon] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [joinedSalons, setJoinedSalons] = useState<Set<string>>(new Set());
  const [newSalon, setNewSalon] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadSalons();
  }, []);

  const loadSalons = async () => {
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('status', 'actif')
      .order('members_count', { ascending: false });

    if (!error && data) {
      setSalons(data);
    }
    setLoading(false);
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const createSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    setCreateError('');

    const { error } = await supabase.from('salons').insert([
      {
        name: newSalon.name,
        description: newSalon.description,
        created_by: user.id,
        status: 'en_attente',
      },
    ]);

    setCreating(false);

    if (error) {
      setCreateError('Erreur : ' + error.message);
    } else {
      setNewSalon({ name: '', description: '' });
      setShowNewSalon(false);
      setCreateError('');
      showSuccess('Salon cree ! Il sera visible apres validation par un administrateur.');
    }
  };

  const joinSalon = async (salonId: string) => {
    if (!user) return;

    const { error } = await supabase.from('salon_members').insert({
      salon_id: salonId,
      user_id: user.id,
    });

    if (!error) {
      setJoinedSalons(prev => new Set(prev).add(salonId));
      showSuccess('Vous avez rejoint le salon !');
      loadSalons();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Salons</h1>
        <button
          onClick={() => setShowNewSalon(true)}
          className="bg-cyan-500 text-white p-3 rounded-full shadow-lg hover:bg-cyan-600 transition"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 shadow-sm">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {showNewSalon && (
        <div className="bg-white rounded-xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-800">Creer un salon</h3>
            <button onClick={() => { setShowNewSalon(false); setCreateError(''); }}>
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={createSalon} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du salon
              </label>
              <input
                type="text"
                required
                value={newSalon.name}
                onChange={(e) => setNewSalon({ ...newSalon, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                placeholder="Ex: Evenements Bagnols-sur-Ceze"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newSalon.description}
                onChange={(e) => setNewSalon({ ...newSalon, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 resize-none"
                rows={3}
                placeholder="Decrivez brievement le theme du salon..."
              />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-800 text-sm">
                <Clock className="w-4 h-4" />
                <span>Votre salon sera visible apres validation par un administrateur</span>
              </div>
            </div>
            {createError && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {createError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 bg-cyan-500 text-white py-2 rounded-lg font-medium hover:bg-cyan-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Creer le salon'}
              </button>
              <button
                type="button"
                onClick={() => { setShowNewSalon(false); setCreateError(''); }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : salons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun salon pour le moment</p>
          <p className="text-sm text-gray-400 mt-2">Creez le premier salon de votre communaute</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {salons.map((salon) => (
            <div
              key={salon.id}
              className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-gray-800">{salon.name}</h3>
                    {salon.is_approved && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {salon.description && (
                    <p className="text-gray-600 text-sm mb-3">{salon.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{salon.members_count} membre{salon.members_count > 1 ? 's' : ''}</span>
                    </div>
                    <button
                      onClick={() => joinSalon(salon.id)}
                      disabled={joinedSalons.has(salon.id)}
                      className="px-4 py-1.5 bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {joinedSalons.has(salon.id) ? 'Rejoint' : 'Rejoindre'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
