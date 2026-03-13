import { useState, useEffect } from 'react';
import { Sprout, MapPin, Phone, Search, Filter, Leaf, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ClaimAgriculteurModal from '../components/ClaimAgriculteurModal';
import { useApp } from '../contexts/AppContext';

interface Agriculteur {
  id: string;
  name: string;
  commune: string;
  address: string;
  postal_code: string;
  phone: string;
  email: string;
  production_type: string;
  vente_directe: boolean;
}

const PRODUCTION_TYPES = [
  'Tous',
  'Apiculture',
  'Arboriculture',
  'Céréales',
  'Élevage bovin',
  'Élevage caprin',
  'Élevage ovin',
  'Maraîchage',
  'Oléiculture',
  'Plantes aromatiques',
  'Viticulture',
];

const typeColors: Record<string, string> = {
  'Viticulture': 'bg-rose-100 text-rose-700',
  'Maraîchage': 'bg-green-100 text-green-700',
  'Arboriculture': 'bg-lime-100 text-lime-700',
  'Élevage bovin': 'bg-amber-100 text-amber-700',
  'Élevage ovin': 'bg-yellow-100 text-yellow-700',
  'Élevage caprin': 'bg-orange-100 text-orange-700',
  'Apiculture': 'bg-yellow-100 text-yellow-800',
  'Oléiculture': 'bg-teal-100 text-teal-700',
  'Céréales': 'bg-stone-100 text-stone-700',
  'Plantes aromatiques': 'bg-emerald-100 text-emerald-700',
};

const PAGE_SIZE = 20;

export default function AgriculteurPage() {
  const { user } = useApp();
  const [agriculteurs, setAgriculteurs] = useState<Agriculteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('Tous');
  const [venteDirecteOnly, setVenteDirecteOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [claimTarget, setClaimTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadAgriculteurs();
  }, [selectedType, venteDirecteOnly, page]);

  const loadAgriculteurs = async () => {
    setLoading(true);
    let query = supabase
      .from('agriculteurs')
      .select('id, name, commune, address, postal_code, phone, email, production_type, vente_directe')
      .order('commune', { ascending: true })
      .order('name', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (selectedType !== 'Tous') {
      query = query.eq('production_type', selectedType);
    }
    if (venteDirecteOnly) {
      query = query.eq('vente_directe', true);
    }

    const { data, error } = await query;
    if (!error && data) {
      setAgriculteurs(data);
    }
    setLoading(false);
  };

  const filtered = search.trim()
    ? agriculteurs.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.commune.toLowerCase().includes(search.toLowerCase()) ||
          a.production_type.toLowerCase().includes(search.toLowerCase())
      )
    : agriculteurs;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exploitants Agricoles</h1>
          <p className="text-sm text-gray-500">Producteurs du Gard Rhodanien</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un producteur, commune..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <button
          onClick={() => { setVenteDirecteOnly(!venteDirecteOnly); setPage(0); }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            venteDirecteOnly
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Leaf className="w-3.5 h-3.5" />
          Vente Directe uniquement
        </button>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {PRODUCTION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => { setSelectedType(type); setPage(0); }}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedType === type
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Sprout className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun résultat</p>
          <p className="text-gray-400 text-sm mt-1">Essayez une autre recherche ou filtre</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 px-1">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</p>
          <div className="grid gap-3">
            {filtered.map((agriculteur) => (
              <div
                key={agriculteur.id}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sprout className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight">{agriculteur.name}</h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {agriculteur.vente_directe && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <Leaf className="w-3 h-3" />
                            Vente Directe
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[agriculteur.production_type] || 'bg-gray-100 text-gray-600'}`}>
                          {agriculteur.production_type}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{agriculteur.address}, {agriculteur.commune} {agriculteur.postal_code}</span>
                      </div>
                      {agriculteur.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          <a href={`tel:${agriculteur.phone}`} className="hover:text-emerald-600 transition-colors">
                            {agriculteur.phone}
                          </a>
                        </div>
                      )}
                    </div>
                    {user && (
                      <button
                        onClick={() => setClaimTarget({ id: agriculteur.id, name: agriculteur.name })}
                        className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 transition-colors"
                      >
                        <Flag className="w-3 h-3" />
                        Revendiquer cette exploitation
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-500">Page {page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={filtered.length < PAGE_SIZE}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Suivant
            </button>
          </div>
        </>
      )}

      {claimTarget && (
        <ClaimAgriculteurModal
          agriculteurId={claimTarget.id}
          agriculteurName={claimTarget.name}
          onClose={() => setClaimTarget(null)}
        />
      )}
    </div>
  );
}
