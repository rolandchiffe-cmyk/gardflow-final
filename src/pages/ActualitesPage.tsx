import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, RefreshCw, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  published_at: string | null;
  guid: string;
  feed_id: string;
  rss_feeds?: { title: string; category: string };
}

export default function ActualitesPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('news_items')
      .select('*, rss_feeds(title, category)')
      .eq('is_local', true)
      .order('published_at', { ascending: false })
      .limit(60);

    if (data) {
      setNews(data as NewsItem[]);
      const cats = Array.from(new Set(data.map((n: any) => n.rss_feeds?.category).filter(Boolean))) as string[];
      setCategories(cats);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-rss`,
        { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } }
      );
      await fetchNews();
    } catch (_) {}
    setRefreshing(false);
  };

  const filtered = selectedCategory === 'all'
    ? news
    : news.filter(n => (n.rss_feeds as any)?.category === selectedCategory);

  const formatDate = (d: string | null) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Actualités Locales</h1>
          <p className="text-sm text-gray-500 mt-0.5">Les dernières nouvelles du Gard Rhodanien</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedCategory === 'all' ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Toutes
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedCategory === cat ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
          <Newspaper className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">Aucune actualité disponible</p>
          <p className="text-sm text-gray-400 mt-1">Les flux RSS seront mis à jour prochainement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition overflow-hidden group"
            >
              <div className="flex gap-3 p-3">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt=""
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0 bg-gray-100"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-cyan-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                    <Newspaper className="w-7 h-7 text-teal-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 group-hover:text-teal-700 transition">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(item.rss_feeds as any)?.title && (
                      <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
                        <Tag className="w-3 h-3" />
                        {(item.rss_feeds as any).title}
                      </span>
                    )}
                    {item.published_at && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.published_at)}
                      </span>
                    )}
                    <ExternalLink className="w-3 h-3 text-gray-300 ml-auto group-hover:text-teal-400 transition" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
