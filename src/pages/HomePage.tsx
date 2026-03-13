import { useState, useEffect } from 'react';
import { Calendar, Heart, ShoppingBag, Tractor, Store, Wrench, Leaf, Newspaper, ExternalLink, Clock, ChevronRight } from 'lucide-react';
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
        .limit(2);
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
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
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
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0 bg-gray-100"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-teal-50 to-cyan-100 rounded-lg flex-shrink-0 flex items-center justify-center">
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
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-teal-600 hover:text-teal-800 transition border border-teal-100 rounded-xl bg-teal-50 hover:bg-teal-100"
      >
        Découvrir toute l'actualité <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function HomePage() {
  const { setCurrentPage } = useApp();

  const stories = [
    { id: 'evenements', icon: Calendar, label: 'Événements', color: 'bg-orange-100', iconColor: 'text-orange-500', ring: 'ring-orange-300' },
    { id: 'agriculteurs', icon: Tractor, label: 'Agriculteurs', color: 'bg-green-100', iconColor: 'text-green-600', ring: 'ring-green-300' },
    { id: 'associations', icon: Heart, label: 'Associations', color: 'bg-rose-100', iconColor: 'text-rose-500', ring: 'ring-rose-300' },
    { id: 'annonces', icon: ShoppingBag, label: 'Annonces', color: 'bg-blue-100', iconColor: 'text-blue-500', ring: 'ring-blue-300' },
  ];

  const serviceCards = [
    { id: 'commerces', icon: Store, label: 'Commerces', description: 'Boutiques & services de proximité', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
    { id: 'commerces', icon: Wrench, label: 'Artisans', description: 'Savoir-faire & métiers locaux', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { id: 'agriculteurs', icon: Leaf, label: 'Produits Locaux', description: 'Circuits courts & agriculture', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-cyan-500 text-white p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-1">Bienvenue sur Gardbook</h2>
        <p className="text-cyan-100 text-sm">Connectez-vous avec votre communauté locale dans le Gard Rhodanien</p>
      </div>

      <div>
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          {stories.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id + s.label}
                onClick={() => setCurrentPage(s.id as any)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div className={`w-14 h-14 rounded-full ${s.color} ring-2 ${s.ring} flex items-center justify-center shadow-sm hover:scale-105 transition-transform`}>
                  <Icon className={`w-6 h-6 ${s.iconColor}`} />
                </div>
                <span className="text-xs text-gray-600 font-medium w-16 text-center leading-tight">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Services locaux</h3>
        <div className="space-y-3">
          {serviceCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={() => setCurrentPage(card.id as any)}
                className={`w-full flex items-center gap-4 p-4 bg-white rounded-2xl border ${card.border} shadow-sm hover:shadow-md transition-all text-left`}
              >
                <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{card.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
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
        </div>
        <div className="p-3">
          <NewsPreview onViewAll={() => setCurrentPage('actualites')} />
        </div>
      </div>
    </div>
  );
}
