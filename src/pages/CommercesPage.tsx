import { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Search, Filter, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ClaimCommerceModal from '../components/ClaimCommerceModal';
import { useApp } from '../contexts/AppContext';

interface Commerce {
  id: string;
  name: string;
  commune: string;
  address: string;
  postal_code: string;
  phone: string;
  email: string;
  category: string;
}

const CATEGORIES = [
  'Toutes',
  'Agence immobilière',
  'Bar / Café',
  'Boucherie',
  'Boulangerie',
  'Carreleur',
  'Coiffeur',
  'Électricien',
  'Épicerie',
  'Fleuriste',
  'Garage automobile',
  'Institut de beauté',
  'Informatique',
  'Librairie',
  'Maçon',
  'Menuisier',
  'Paysagiste',
  'Peintre bâtiment',
  'Photographe',
  'Plombier',
  'Restaurant',
];

export default function CommercesPage() {
  const { user } = useApp();
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [page, setPage] = useState(0);
  const [claimTarget, setClaimTarget] = useState<{ id: string; name: string } | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadCommerces();
  }, [selectedCategory, page]);

  const loadCommerces = async () => {
    setLoading(true);
    let query = supabase
      .from('commerces_artisans')
      .select('id, name, commune, address, postal_code, phone, email, category')
      .order('commune', { ascending: true })
      .order('name', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (selectedCategory !== 'Toutes') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;
    if (!error && data) {
      setCommerces(data);
    }
    setLoading(false);
  };

  const filtered = search.trim()
    ? commerces.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.commune.toLowerCase().includes(search.toLowerCase()) ||
          c.category.toLowerCase().includes(search.toLowerCase())
      )
    : commerces;

  const categoryColors: Record<string, string> = {
    'Boucherie': 'bg-red-100 text-red-700',
    'Boulangerie': 'bg-amber-100 text-amber-700',
    'Restaurant': 'bg-orange-100 text-orange-700',
    'Bar / Café': 'bg-yellow-100 text-yellow-700',
    'Épicerie': 'bg-lime-100 text-lime-700',
    'Fleuriste': 'bg-pink-100 text-pink-700',
    'Coiffeur': 'bg-purple-100 text-purple-700',
    'Institut de beauté': 'bg-rose-100 text-rose-700',
    'Garage automobile': 'bg-gray-100 text-gray-700',
    'Électricien': 'bg-blue-100 text-blue-700',
    'Plombier': 'bg-cyan-100 text-cyan-700',
    'Maçon': 'bg-stone-100 text-stone-700',
    'Menuisier': 'bg-brown-100 text-yellow-800',
    'Peintre bâtiment': 'bg-indigo-100 text-indigo-700',
    'Carreleur': 'bg-teal-100 text-teal-700',
    'Paysagiste': 'bg-green-100 text-green-700',
    'Informatique': 'bg-sky-100 text-sky-700',
    'Photographe': 'bg-violet-100 text-violet-700',
    'Librairie': 'bg-emerald-100 text-emerald-700',
    'Agence immobilière': 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Commerces & Artisans</h1>
          <p className="text-sm text-gray-500">Annuaire du Gard Rhodanien</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un commerce, artisan, commune..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setPage(0); }}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Store className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun résultat</p>
          <p className="text-gray-400 text-sm mt-1">Essayez une autre recherche ou catégorie</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 px-1">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</p>
          <div className="grid gap-3">
            {filtered.map((commerce) => (
              <div
                key={commerce.id}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight">{commerce.name}</h3>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[commerce.category] || 'bg-gray-100 text-gray-600'}`}>
                        {commerce.category}
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{commerce.address}, {commerce.commune} {commerce.postal_code}</span>
                      </div>
                      {commerce.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          <a href={`tel:${commerce.phone}`} className="hover:text-green-600 transition-colors">
                            {commerce.phone}
                          </a>
                        </div>
                      )}
                    </div>
                    {user && (
                      <button
                        onClick={() => setClaimTarget({ id: commerce.id, name: commerce.name })}
                        className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Flag className="w-3 h-3" />
                        Revendiquer cette entreprise
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
        <ClaimCommerceModal
          commerceId={claimTarget.id}
          commerceName={claimTarget.name}
          onClose={() => setClaimTarget(null)}
        />
      )}
    </div>
  );
}
