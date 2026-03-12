import { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Commerce {
  id: string;
  name: string;
  description: string | null;
  category: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  created_at: string;
}

export default function CommercesPage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommerces();
  }, []);

  const loadCommerces = async () => {
    const { data, error } = await supabase
      .from('commerces')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCommerces(data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Commerces Locaux</h1>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : commerces.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun commerce référencé pour le moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {commerces.map((commerce) => (
            <div
              key={commerce.id}
              className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{commerce.name}</h3>
                  <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full mb-2">
                    {commerce.category}
                  </span>
                  {commerce.description && (
                    <p className="text-gray-600 text-sm mb-3">{commerce.description}</p>
                  )}
                  <div className="space-y-1">
                    {commerce.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{commerce.address}</span>
                      </div>
                    )}
                    {commerce.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{commerce.phone}</span>
                      </div>
                    )}
                    {commerce.website && (
                      <div className="flex items-center gap-2 text-sm text-cyan-600">
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <a
                          href={commerce.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline truncate"
                        >
                          {commerce.website}
                        </a>
                      </div>
                    )}
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
