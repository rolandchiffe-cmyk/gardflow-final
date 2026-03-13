import { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, MapPin, Newspaper, ExternalLink, Clock, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  published_at: string | null;
  rss_feeds?: { title: string };
}

function NewsPreview({ onViewAll }: { onViewAll: () => void }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('news_items')
        .select('id, title, description, url, image_url, published_at, rss_feeds(title)')
        .eq('is_local', true)
        .order('published_at', { ascending: false })
        .limit(4);
      if (data) setNews(data as NewsItem[]);
      setLoading(false);
    })();
  }, []);

  const formatDate = (d: string | null) => {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="flex gap-3 p-3 bg-white rounded-xl animate-pulse">
            <div className="w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <div className="space-y-2">
      {news.map(item => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-3 p-3 bg-white rounded-xl hover:shadow-md transition group border border-transparent hover:border-teal-100"
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt=""
              className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-100"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-14 h-14 bg-gradient-to-br from-teal-50 to-cyan-100 rounded-lg flex-shrink-0 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-teal-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-teal-700 transition">{item.title}</p>
            <div className="flex items-center gap-2 mt-1">
              {(item.rss_feeds as any)?.title && (
                <span className="text-xs text-teal-600 font-medium">{(item.rss_feeds as any).title}</span>
              )}
              {item.published_at && (
                <span className="flex items-center gap-0.5 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />{formatDate(item.published_at)}
                </span>
              )}
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-teal-400 transition flex-shrink-0 mt-1" />
        </a>
      ))}
      <button
        onClick={onViewAll}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-teal-600 hover:text-teal-800 transition"
      >
        Voir toutes les actualités <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function HomePage() {
  const { setCurrentPage } = useApp();

  const highlights = [
    { id: 'discussions', title: 'Discussions', description: 'Partagez vos idées avec la communauté', icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
    { id: 'salons', title: 'Salons', description: 'Rejoignez des groupes de discussion', icon: Users, color: 'from-teal-500 to-green-500' },
    { id: 'evenements', title: 'Événements', description: 'Découvrez les événements locaux', icon: Calendar, color: 'from-orange-500 to-red-500' },
  ];

  const commerceSubCategories = [
    { label: 'Commerces', description: 'Boutiques & services' },
    { label: 'Artisans', description: 'Savoir-faire local' },
    { label: 'Produits Locaux', description: 'Circuits courts' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-cyan-500 text-white p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-2">Bienvenue sur GardFlow</h2>
        <p className="text-cyan-100">Connectez-vous avec votre communauté locale dans le Gard Rhodanien</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as any)}
              className={`bg-gradient-to-br ${item.color} text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1`}
            >
              <Icon className="w-8 h-8 mb-3" />
              <h3 className="font-bold mb-1">{item.title}</h3>
              <p className="text-xs opacity-90">{item.description}</p>
            </button>
          );
        })}
        <button
          onClick={() => setCurrentPage('commerces')}
          className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-7 h-7" />
            <h3 className="font-bold">Commerces</h3>
          </div>
          <div className="space-y-1.5">
            {commerceSubCategories.map((sub) => (
              <div key={sub.label} className="flex items-center gap-1.5 bg-white/15 rounded-lg px-2 py-1">
                <span className="text-xs font-semibold">{sub.label}</span>
                <span className="text-[10px] opacity-75">· {sub.description}</span>
              </div>
            ))}
          </div>
        </button>
      </div>

      <div className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Actualités Locales</h3>
              <p className="text-xs text-gray-400">Gard Rhodanien</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('actualites')}
            className="text-xs text-teal-600 font-medium hover:text-teal-800 transition flex items-center gap-0.5"
          >
            Tout voir <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-3">
          <NewsPreview onViewAll={() => setCurrentPage('actualites')} />
        </div>
      </div>
    </div>
  );
}
