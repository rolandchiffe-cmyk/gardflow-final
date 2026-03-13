import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trash2, Eye, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';

interface PendingPost {
  id: string;
  content: string;
  images: string[];
  video_url: string | null;
  created_at: string;
  status: string;
  users: {
    id: string;
    username: string;
    prenom: string | null;
    nom: string | null;
    photo_profil_url: string | null;
    account_type: string;
  };
}

interface PendingSalon {
  id: string;
  name: string;
  description: string;
  created_at: string;
  status: string;
  users: {
    id: string;
    username: string;
    prenom: string | null;
    nom: string | null;
    account_type: string;
  };
}

interface PendingPublicite {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
  status: string;
  commerces: {
    name: string;
    users: {
      id: string;
      username: string;
    };
  };
}

export default function ModerationPage() {
  const { user, userRole } = useApp();
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [pendingSalons, setPendingSalons] = useState<PendingSalon[]>([]);
  const [pendingPublicites, setPendingPublicites] = useState<PendingPublicite[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'salons' | 'publicites'>('posts');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole === 'admin') {
      loadPendingContent();
    }
  }, [user, userRole, activeTab]);

  const loadPendingContent = async () => {
    setLoading(true);

    if (activeTab === 'posts') {
      const { data } = await supabase
        .from('posts')
        .select('*, users(id, username, prenom, nom, photo_profil_url, account_type)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (data) {
        setPendingPosts(data.map(post => ({
          ...post,
          images: Array.isArray(post.images) ? post.images : []
        })) as any);
      }
    } else if (activeTab === 'salons') {
      const { data } = await supabase
        .from('salons')
        .select('*, users!salons_created_by_fkey(id, username, prenom, nom, account_type)')
        .eq('status', 'en_attente')
        .order('created_at', { ascending: false });

      if (data) {
        setPendingSalons(data as any);
      }
    } else if (activeTab === 'publicites') {
      const { data } = await supabase
        .from('publicites')
        .select('*, commerces(name, users(id, username))')
        .eq('status', 'en_attente_validation')
        .order('created_at', { ascending: false });

      if (data) {
        setPendingPublicites(data as any);
      }
    }

    setLoading(false);
  };

  const validatePost = async (postId: string) => {
    await supabase
      .from('posts')
      .update({
        status: 'published',
        validated_by: user!.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    loadPendingContent();
  };

  const rejectPost = async (postId: string) => {
    const reason = prompt('Raison du refus :');
    if (!reason) return;

    await supabase
      .from('posts')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        validated_by: user!.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    loadPendingContent();
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette publication ?')) return;

    await supabase.from('posts').delete().eq('id', postId);
    loadPendingContent();
  };

  const validateSalon = async (salonId: string) => {
    await supabase
      .from('salons')
      .update({
        status: 'actif',
        validated_by: user!.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', salonId);

    loadPendingContent();
  };

  const rejectSalon = async (salonId: string) => {
    const reason = prompt('Raison du refus :');
    if (!reason) return;

    await supabase
      .from('salons')
      .update({
        status: 'refuse',
        rejection_reason: reason,
        validated_by: user!.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', salonId);

    loadPendingContent();
  };

  const deleteSalon = async (salonId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce salon ?')) return;

    await supabase.from('salons').delete().eq('id', salonId);
    loadPendingContent();
  };

  const validatePublicite = async (publiciteId: string) => {
    await supabase
      .from('publicites')
      .update({
        status: 'valide',
        validated_by: user!.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', publiciteId);

    loadPendingContent();
  };

  const rejectPublicite = async (publiciteId: string) => {
    const reason = prompt('Raison du refus :');
    if (!reason) return;

    await supabase
      .from('publicites')
      .update({
        status: 'refuse',
        rejection_reason: reason,
        validated_by: user!.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', publiciteId);

    loadPendingContent();
  };

  const deletePublicite = async (publiciteId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette publicité ?')) return;

    await supabase.from('publicites').delete().eq('id', publiciteId);
    loadPendingContent();
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return postDate.toLocaleDateString('fr-FR');
  };

  if (userRole !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-2xl font-bold text-gray-800">Modération</h1>

      <div className="flex gap-2 bg-white rounded-xl shadow-md p-2">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
            activeTab === 'posts'
              ? 'bg-cyan-500 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Publications ({pendingPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('salons')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
            activeTab === 'salons'
              ? 'bg-cyan-500 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Salons ({pendingSalons.length})
        </button>
        <button
          onClick={() => setActiveTab('publicites')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
            activeTab === 'publicites'
              ? 'bg-cyan-500 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Publicités ({pendingPublicites.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'posts' && pendingPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-400">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  EN ATTENTE
                </span>
                <span className="text-xs text-gray-500">{getTimeAgo(post.created_at)}</span>
              </div>

              <div className="flex items-start gap-3 mb-3">
                {post.users.photo_profil_url ? (
                  <img
                    src={post.users.photo_profil_url}
                    alt={post.users.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {post.users.username[0]?.toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="font-semibold text-gray-900">
                    {post.users.prenom && post.users.nom
                      ? `${post.users.prenom} ${post.users.nom}`
                      : post.users.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    Compte {post.users.account_type}
                  </p>
                </div>
              </div>

              <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>

              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {post.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {post.video_url && (
                <video
                  src={post.video_url}
                  controls
                  className="w-full rounded-lg mb-3 max-h-64"
                />
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => validatePost(post.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  <CheckCircle className="w-5 h-5" />
                  Valider
                </button>
                <button
                  onClick={() => rejectPost(post.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  <XCircle className="w-5 h-5" />
                  Refuser
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'salons' && pendingSalons.map((salon) => (
            <div key={salon.id} className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-400">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  EN ATTENTE
                </span>
                <span className="text-xs text-gray-500">{getTimeAgo(salon.created_at)}</span>
              </div>

              <h3 className="font-bold text-lg text-gray-900 mb-2">{salon.name}</h3>
              <p className="text-gray-700 mb-3">{salon.description}</p>

              <p className="text-sm text-gray-600 mb-3">
                Créé par: {salon.users.prenom && salon.users.nom
                  ? `${salon.users.prenom} ${salon.users.nom}`
                  : salon.users.username}
              </p>

              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => validateSalon(salon.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  <CheckCircle className="w-5 h-5" />
                  Valider
                </button>
                <button
                  onClick={() => rejectSalon(salon.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  <XCircle className="w-5 h-5" />
                  Refuser
                </button>
                <button
                  onClick={() => deleteSalon(salon.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'publicites' && pendingPublicites.map((pub) => (
            <div key={pub.id} className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-400">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  EN ATTENTE VALIDATION
                </span>
                <span className="text-xs text-gray-500">{getTimeAgo(pub.created_at)}</span>
              </div>

              <div className="flex gap-4">
                {pub.image_url && (
                  <img
                    src={pub.image_url}
                    alt={pub.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{pub.title}</h3>
                  <p className="text-gray-700 mb-2">{pub.description}</p>
                  <p className="text-sm text-gray-600">
                    Commerce: {pub.commerces.name}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-200 mt-3">
                <button
                  onClick={() => validatePublicite(pub.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  <CheckCircle className="w-5 h-5" />
                  Valider
                </button>
                <button
                  onClick={() => rejectPublicite(pub.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  <XCircle className="w-5 h-5" />
                  Refuser
                </button>
                <button
                  onClick={() => deletePublicite(pub.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'posts' && pendingPosts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <Eye className="w-16 h-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">Aucune publication en attente</p>
            </div>
          )}

          {activeTab === 'salons' && pendingSalons.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <Eye className="w-16 h-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">Aucun salon en attente</p>
            </div>
          )}

          {activeTab === 'publicites' && pendingPublicites.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <Eye className="w-16 h-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">Aucune publicité en attente</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
