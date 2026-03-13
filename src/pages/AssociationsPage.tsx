import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, MapPin, Search, X, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ClaimAssociationModal from '../components/ClaimAssociationModal';

interface Association {
  id: string;
  name: string;
  description: string | null;
  category: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  postal_code: string | null;
  commune_name: string | null;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Culture: 'bg-blue-100 text-blue-700',
  Sport: 'bg-green-100 text-green-700',
  Education: 'bg-yellow-100 text-yellow-700',
  Environnement: 'bg-emerald-100 text-emerald-700',
  Patrimoine: 'bg-amber-100 text-amber-700',
  Loisirs: 'bg-orange-100 text-orange-700',
  Animation: 'bg-pink-100 text-pink-700',
  Musique: 'bg-violet-100 text-violet-700',
  Solidarité: 'bg-red-100 text-red-700',
  Jeunesse: 'bg-cyan-100 text-cyan-700',
};

const CATEGORY_ICON_BG: Record<string, string> = {
  Culture: 'from-blue-400 to-blue-600',
  Sport: 'from-green-400 to-green-600',
  Education: 'from-yellow-400 to-yellow-600',
  Environnement: 'from-emerald-400 to-emerald-600',
  Patrimoine: 'from-amber-400 to-amber-600',
  Loisirs: 'from-orange-400 to-orange-600',
  Animation: 'from-pink-400 to-pink-600',
  Musique: 'from-violet-400 to-violet-600',
  Solidarité: 'from-red-400 to-red-600',
  Jeunesse: 'from-cyan-400 to-cyan-600',
};

export default function AssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [filtered, setFiltered] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [claimTarget, setClaimTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadAssociations();
  }, []);

  useEffect(() => {
    let result = associations;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.commune_name ?? '').toLowerCase().includes(q) ||
          (a.category ?? '').toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      result = result.filter((a) => a.category === selectedCategory);
    }

    if (selectedCommune) {
      result = result.filter((a) => a.commune_name === selectedCommune);
    }

    setFiltered(result);
  }, [search, selectedCategory, selectedCommune, associations]);

  const loadAssociations = async () => {
    const { data, error } = await supabase
      .from('associations')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setAssociations(data);
      setFiltered(data);
    }
    setLoading(false);
  };

  const categories = [...new Set(associations.map((a) => a.category).filter(Boolean))].sort();
  const communes = [...new Set(associations.map((a) => a.commune_name).filter(Boolean))].sort();

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedCommune('');
  };

  const hasActiveFilters = search || selectedCategory || selectedCommune;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Associations</h1>
        <p className="text-sm text-gray-500 mt-0.5">{filtered.length} association{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-200 p-4 space-y-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
          <input
            type="text"
            placeholder="Rechercher une association, une commune..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-sm placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-teal-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-teal-700 mb-1 block uppercase tracking-wide">Commune</label>
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className="w-full border border-teal-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
            >
              <option value="">Toutes les communes</option>
              {communes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Effacer les filtres
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune association trouvée</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-2 text-teal-600 text-sm hover:underline">
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((association) => (
            <div
              key={association.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 bg-gradient-to-br ${CATEGORY_ICON_BG[association.category] ?? 'from-gray-400 to-gray-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight">{association.name}</h3>
                    {association.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CATEGORY_COLORS[association.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {association.category}
                      </span>
                    )}
                  </div>

                  {(association.commune_name || association.address) && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {[association.address, association.commune_name, association.postal_code]
                          .filter(Boolean)
                          .join(' — ')}
                      </span>
                    </div>
                  )}

                  {association.description && (
                    <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">{association.description}</p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                    <div className="flex flex-wrap gap-3">
                      {association.contact_email && (
                        <a
                          href={`mailto:${association.contact_email}`}
                          className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800"
                        >
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[160px]">{association.contact_email}</span>
                        </a>
                      )}
                      {association.contact_phone && (
                        <a
                          href={`tel:${association.contact_phone}`}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {association.contact_phone}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => setClaimTarget({ id: association.id, name: association.name })}
                      className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium border border-amber-200 hover:border-amber-400 rounded-lg px-2 py-1 transition bg-amber-50 hover:bg-amber-100 flex-shrink-0"
                    >
                      <Flag className="w-3 h-3" />
                      Revendiquer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 text-center shadow-sm">
        <Flag className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-amber-800">Vous représentez une association ?</p>
        <p className="text-xs text-amber-600 mt-1">Revendiquez votre fiche pour gérer vos informations, publier des événements et entrer en contact avec vos membres.</p>
        <button
          onClick={() => setClaimTarget({ id: '', name: '' })}
          className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition"
        >
          Revendiquer mon association
        </button>
      </div>

      {claimTarget !== null && (
        <ClaimAssociationModal
          associationId={claimTarget.id}
          associationName={claimTarget.name}
          onClose={() => setClaimTarget(null)}
        />
      )}
    </div>
  );
}
