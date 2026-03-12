import { useState, useEffect } from 'react';
import { Heart, Mail, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Association {
  id: string;
  name: string;
  description: string | null;
  category: string;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
}

export default function AssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssociations();
  }, []);

  const loadAssociations = async () => {
    const { data, error } = await supabase
      .from('associations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAssociations(data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Associations</h1>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : associations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune association référencée pour le moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {associations.map((association) => (
            <div
              key={association.id}
              className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{association.name}</h3>
                  <span className="inline-block bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded-full mb-2">
                    {association.category}
                  </span>
                  {association.description && (
                    <p className="text-gray-600 text-sm mb-3">{association.description}</p>
                  )}
                  <div className="space-y-1">
                    {association.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <a
                          href={`mailto:${association.contact_email}`}
                          className="hover:text-cyan-600 truncate"
                        >
                          {association.contact_email}
                        </a>
                      </div>
                    )}
                    {association.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <a href={`tel:${association.contact_phone}`} className="hover:text-cyan-600">
                          {association.contact_phone}
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
