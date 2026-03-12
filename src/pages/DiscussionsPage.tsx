import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Heart, Share2, Flag, Filter, X, Send, Image as ImageIcon, Video, Link } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import AutoPlayVideo from '../components/AutoPlayVideo';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  images: string[];
  video_url: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  commune_id: string | null;
  users: {
    id: string;
    username: string;
    avatar_url: string | null;
    photo_profil_url: string | null;
    prenom: string | null;
    nom: string | null;
    commune_id: string | null;
    communes?: {
      name: string;
    };
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  users: {
    username: string;
    avatar_url: string | null;
    photo_profil_url: string | null;
  };
}

interface Commune {
  id: string;
  name: string;
}

interface Advertisement {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  commerces: {
    name: string;
    commune_id: string | null;
    communes?: {
      name: string;
    };
  };
}

export default function DiscussionsPage() {
  const { user, userProfile } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedCommune, setSelectedCommune] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'my-commune' | 'choose' | 'around'>('all');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [newPostCommune, setNewPostCommune] = useState<string>('');
  const [userCommune, setUserCommune] = useState<Commune | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserCommune();
      loadPosts();
      loadCommunes();
      loadAds();
      loadUserLikes();
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (user && filterType) {
      loadPosts();
    }
  }, [filterType, selectedCommune]);

  const loadUserCommune = async () => {
    if (!userProfile?.commune_id) return;

    const { data } = await supabase
      .from('communes')
      .select('*')
      .eq('id', userProfile.commune_id)
      .maybeSingle();

    if (data) {
      setUserCommune(data);
    }
  };

  const loadCommunes = async () => {
    const { data } = await supabase
      .from('communes')
      .select('*')
      .order('name');

    if (data) {
      setCommunes(data);
    }
  };

  const loadPosts = async () => {
    let query = supabase
      .from('posts')
      .select(`
        *,
        users!posts_user_id_fkey (
          id,
          username,
          avatar_url,
          photo_profil_url,
          prenom,
          nom,
          commune_id,
          communes (name)
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (filterType === 'my-commune' && userProfile?.commune_id) {
      query = query.eq('users.commune_id', userProfile.commune_id);
    } else if (filterType === 'choose' && selectedCommune !== 'all') {
      query = query.eq('users.commune_id', selectedCommune);
    }

    const { data, error } = await query;

    if (!error && data) {
      setPosts(data.map(post => ({
        ...post,
        images: Array.isArray(post.images) ? post.images : []
      })) as any);
    }
    setLoading(false);
  };

  const loadAds = async () => {
    const { data } = await supabase
      .from('publicites')
      .select(`
        *,
        commerces (
          name,
          commune_id,
          communes (name)
        )
      `)
      .eq('is_active', true)
      .eq('status', 'valide')
      .limit(10);

    if (data) {
      setAds(data as any);
    }
  };

  const loadUserLikes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id);

    if (data) {
      setLikedPosts(new Set(data.map(like => like.post_id)));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 10) {
      alert('Vous ne pouvez ajouter que 10 images maximum');
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<{ imageUrls: string[], videoUrl: string | null }> => {
    const imageUrls: string[] = [];
    let videoUrl: string | null = null;

    for (const image of selectedImages) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}_${Math.random()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, image);

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(data.path);
        imageUrls.push(publicUrl);
      }
    }

    if (selectedVideo) {
      const fileExt = selectedVideo.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}_${Math.random()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, selectedVideo);

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(data.path);
        videoUrl = publicUrl;
      }
    }

    return { imageUrls, videoUrl };
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !newContent.trim()) return;

    setUploading(true);

    try {
      const { imageUrls, videoUrl } = await uploadFiles();

      const postStatus = userProfile.account_type === 'professionnel' ? 'pending' : 'published';

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          content: newContent,
          commune_id: userProfile.commune_id || null,
          images: imageUrls.length > 0 ? imageUrls : [],
          video_url: videoUrl || null,
          status: postStatus,
        },
      ]);

      if (error) {
        console.error('Erreur création post:', error);
        alert(`Erreur lors de la publication : ${error.message}`);
      } else {
        if (postStatus === 'pending') {
          alert('Votre publication a été envoyée et sera visible après validation par un administrateur.');
        }
        setNewContent('');
        setNewPostCommune('');
        setSelectedImages([]);
        setSelectedVideo(null);
        setShowNewPost(false);
        loadPosts();
      }
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const isLiked = likedPosts.has(postId);

    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      const post = posts.find(p => p.id === postId);
      if (post) {
        await supabase
          .from('posts')
          .update({ likes_count: Math.max(0, post.likes_count - 1) })
          .eq('id', postId);
      }

      setLikedPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id });

      const post = posts.find(p => p.id === postId);
      if (post) {
        await supabase
          .from('posts')
          .update({ likes_count: post.likes_count + 1 })
          .eq('id', postId);
      }

      setLikedPosts(prev => new Set(prev).add(postId));
    }

    loadPosts();
  };

  const openShareModal = (postId: string) => {
    setSharePostId(postId);
    setLinkCopied(false);
  };

  const closeShareModal = () => {
    setSharePostId(null);
    setLinkCopied(false);
  };

  const getShareUrl = (postId: string) => {
    return `${window.location.origin}${window.location.pathname}?post=${postId}`;
  };

  const copyLink = async (postId: string) => {
    try {
      await navigator.clipboard.writeText(getShareUrl(postId));
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = getShareUrl(postId);
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
    if (user) {
      const post = posts.find(p => p.id === postId);
      await supabase.from('shares').insert({ post_id: postId, user_id: user.id });
      if (post) {
        await supabase.from('posts').update({ shares_count: post.shares_count + 1 }).eq('id', postId);
        loadPosts();
      }
    }
  };

  const shareToFacebook = (postId: string) => {
    const url = encodeURIComponent(getShareUrl(postId));
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = (postId: string, content: string) => {
    const text = encodeURIComponent(`${content.slice(0, 100)}${content.length > 100 ? '...' : ''} ${getShareUrl(postId)}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToMessenger = (postId: string) => {
    const url = encodeURIComponent(getShareUrl(postId));
    window.open(`https://www.facebook.com/dialog/send?link=${url}&app_id=291494419107518&redirect_uri=${url}`, '_blank', 'width=600,height=400');
  };

  const reportPost = async (postId: string, reportedUserId: string) => {
    if (!user) return;

    const reason = prompt('Raison du signalement :');
    if (!reason) return;

    await supabase.from('signalements').insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      content_type: 'post',
      content_id: postId,
      reason: reason,
    });

    alert('Signalement envoyé');
  };

  const loadComments = async (postId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*, users(username, avatar_url, photo_profil_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(prev => ({ ...prev, [postId]: data as any }));
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      setExpandedComments(prev => new Set(prev).add(postId));
      await loadComments(postId);
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment[postId]?.trim()) return;

    await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      content: newComment[postId],
    });

    const post = posts.find(p => p.id === postId);
    if (post) {
      await supabase
        .from('posts')
        .update({ comments_count: post.comments_count + 1 })
        .eq('id', postId);
    }

    setNewComment(prev => ({ ...prev, [postId]: '' }));
    await loadComments(postId);
    loadPosts();
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return postDate.toLocaleDateString('fr-FR');
  };

  const getUserDisplayName = (post: Post) => {
    if (post.users.prenom && post.users.nom) {
      return `${post.users.prenom} ${post.users.nom}`;
    }
    return post.users.username || 'Utilisateur';
  };

  const getUserAvatar = (user: any) => {
    return user.photo_profil_url || user.avatar_url;
  };

  const renderContent = () => {
    const items = [];
    for (let i = 0; i < posts.length; i++) {
      items.push(posts[i]);
      if ((i + 1) % 8 === 0 && ads.length > 0) {
        items.push({ isAd: true, ad: ads[Math.floor(i / 8) % ads.length] });
      }
    }
    return items;
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between sticky top-0 bg-gray-50 py-3 z-10">
        <h1 className="text-2xl font-bold text-gray-800">Discussions</h1>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="bg-white border-2 border-gray-200 text-gray-700 p-2 rounded-lg shadow hover:bg-gray-50 transition"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {showFilter && (
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Filtrer les publications</h3>
            <button onClick={() => setShowFilter(false)}>
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setFilterType('all')}
              className={`w-full px-4 py-3 rounded-lg text-left transition ${
                filterType === 'all'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes les communes
            </button>

            <button
              onClick={() => setFilterType('my-commune')}
              className={`w-full px-4 py-3 rounded-lg text-left transition ${
                filterType === 'my-commune'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ma commune {userCommune && `(${userCommune.name})`}
            </button>

            <button
              onClick={() => setFilterType('choose')}
              className={`w-full px-4 py-3 rounded-lg text-left transition ${
                filterType === 'choose'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Choisir une commune
            </button>

            <button
              onClick={() => setFilterType('around')}
              className={`w-full px-4 py-3 rounded-lg text-left transition ${
                filterType === 'around'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Autour de moi
            </button>
          </div>

          {filterType === 'choose' && (
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">Sélectionner une commune</option>
              {communes.map((commune) => (
                <option key={commune.id} value={commune.id}>
                  {commune.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {showNewPost && (
        <form onSubmit={createPost} className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3">Nouvelle publication</h3>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Quoi de neuf ?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 resize-none"
            rows={4}
            required
          />

          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <label className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer">
                <ImageIcon className="w-5 h-5" />
                <span>Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={selectedVideo !== null}
                />
              </label>
              <label className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer">
                <Video className="w-5 h-5" />
                <span>Vidéo</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                  disabled={selectedImages.length > 0}
                />
              </label>
            </div>

            {selectedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedVideo && (
              <div className="relative">
                <video
                  src={URL.createObjectURL(selectedVideo)}
                  controls
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowNewPost(false);
                setNewContent('');
                setNewPostCommune('');
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {renderContent().map((item: any, index) => {
            if (item.isAd) {
              const ad = item.ad;
              return (
                <div
                  key={`ad-${index}`}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-amber-700 bg-amber-200 px-3 py-1 rounded-full">
                      PUBLICITÉ
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    {ad.image_url && (
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 mb-1">{ad.title}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ad.description}</p>
                      <p className="text-xs text-gray-500">
                        {ad.commerces?.name}
                        {ad.commerces?.communes?.name && ` • ${ad.commerces.communes.name}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            const post = item;
            const avatarUrl = getUserAvatar(post.users);
            const displayName = getUserDisplayName(post);

            return (
              <div key={post.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                <div className="flex items-start gap-3 mb-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {displayName[0]?.toUpperCase() || 'U'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{displayName}</p>
                    <p className="text-sm text-gray-500">
                      {post.users?.communes?.name && `${post.users.communes.name} • `}
                      {getTimeAgo(post.created_at)}
                    </p>
                  </div>
                </div>

                <p className="text-gray-800 mb-3 whitespace-pre-wrap leading-relaxed">{post.content}</p>

                {post.images && post.images.length > 0 && (
                  <div className={`grid gap-2 mb-3 ${
                    post.images.length === 1 ? 'grid-cols-1' :
                    post.images.length === 2 ? 'grid-cols-2' :
                    post.images.length === 3 ? 'grid-cols-3' :
                    'grid-cols-2'
                  }`}>
                    {post.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {post.image_url && !post.images?.length && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full rounded-lg mb-3 max-h-96 object-cover"
                  />
                )}

                {post.video_url && (
                  <AutoPlayVideo
                    src={post.video_url}
                    className="w-full rounded-lg mb-3 max-h-96"
                  />
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 transition ${
                      likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{post.likes_count}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-cyan-500 transition"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments_count}</span>
                  </button>

                  <button
                    onClick={() => openShareModal(post.id)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-green-500 transition"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.shares_count || 0}</span>
                  </button>

                  <button
                    onClick={() => reportPost(post.id, post.users.id)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition ml-auto"
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                </div>

                {expandedComments.has(post.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {comments[post.id]?.map((comment) => {
                      const commentAvatar = getUserAvatar(comment.users);
                      return (
                        <div key={comment.id} className="flex gap-3">
                          {commentAvatar ? (
                            <img
                              src={commentAvatar}
                              alt={comment.users?.username}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {comment.users?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}

                          <div className="flex-1 bg-gray-50 rounded-lg p-3">
                            <p className="font-semibold text-sm text-gray-900 mb-1">
                              {comment.users?.username}
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex gap-3 mt-4">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) =>
                          setNewComment({ ...newComment, [post.id]: e.target.value })
                        }
                        placeholder="Ajouter un commentaire..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addComment(post.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => addComment(post.id)}
                        disabled={!newComment[post.id]?.trim()}
                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!showNewPost && (
        <button
          onClick={() => setShowNewPost(true)}
          className="fixed bottom-20 right-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-cyan-500/50 active:scale-95 transition-all duration-200 z-50"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {sharePostId && (() => {
        const sharedPost = posts.find(p => p.id === sharePostId);
        return (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4" onClick={closeShareModal}>
            <div
              className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-lg">Partager</h3>
                <button onClick={closeShareModal} className="text-gray-400 hover:text-gray-600 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => copyLink(sharePostId)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${linkCopied ? 'bg-green-100' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {linkCopied ? (
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <Link className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{linkCopied ? 'Copié !' : 'Lien'}</span>
                </button>

                <button
                  onClick={() => shareToFacebook(sharePostId)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Facebook</span>
                </button>

                <button
                  onClick={() => shareToWhatsApp(sharePostId, sharedPost?.content || '')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-green-500 hover:bg-green-600 flex items-center justify-center transition">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">WhatsApp</span>
                </button>

                <button
                  onClick={() => shareToMessenger(sharePostId)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 flex items-center justify-center transition">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Messenger</span>
                </button>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className="text-xs text-gray-500 flex-1 truncate">{getShareUrl(sharePostId)}</span>
                <button
                  onClick={() => copyLink(sharePostId)}
                  className="text-xs text-cyan-600 font-semibold hover:text-cyan-700 transition flex-shrink-0"
                >
                  Copier
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
