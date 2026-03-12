import { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Euro } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Annonce {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number | null;
  status: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnonces();
  }, []);

  const loadAnnonces = async () => {
    const { data, error } = await supabase
      .from('annonces')
      .select('*, profiles(username)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnonces(data as any);
    }
    setLoading(false);
  };

  const categories = ['Toutes', 'Vente', 'Location', 'Recherche', 'Don'];
  const [selectedCategory, setSelectedCategory] = useState('Toutes');

  const filteredAnnonces =
    selectedCategory === 'Toutes'
      ? annonces
      : annonces.filter((a) => a.category === selectedCategory);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Annonces</h1>
        <button className="bg-cyan-500 text-white p-3 rounded-full shadow-lg hover:bg-cyan-600 transition">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAnnonces.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune annonce dans cette catégorie</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAnnonces.map((annonce) => (
            <div
              key={annonce.id}
              className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{annonce.title}</h3>
                    {annonce.price && (
                      <div className="flex items-center gap-1 text-cyan-600 font-bold">
                        <Euro className="w-4 h-4" />
                        <span>{annonce.price}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{annonce.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
                      {annonce.category}
                    </span>
                    <span>Par {annonce.profiles?.username}</span>
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
