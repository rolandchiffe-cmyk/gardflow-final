import { useState, useEffect } from 'react';
import { Users, FileText, MessageSquare, ShoppingBag, Store, Megaphone, AlertTriangle, Shield, BarChart3, Search, User, Building2, CheckCircle, Ban, Crown, XCircle, Trash2, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';

type AdminSection = 'users' | 'posts' | 'salons' | 'annonces' | 'commerces' | 'ads' | 'reports' | 'sanctions' | 'stats';

export default function AdminPanelPage() {
  const { userRole } = useApp();
  const [activeSection, setActiveSection] = useState<AdminSection>('users');

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'users' as const, label: 'Utilisateurs', icon: Users },
    { id: 'posts' as const, label: 'Publications', icon: FileText },
    { id: 'salons' as const, label: 'Validation Salons', icon: MessageSquare },
    { id: 'annonces' as const, label: 'Annonces', icon: ShoppingBag },
    { id: 'commerces' as const, label: 'Commerces', icon: Store },
    { id: 'ads' as const, label: 'Publicités', icon: Megaphone },
    { id: 'reports' as const, label: 'Signalements', icon: AlertTriangle },
    { id: 'sanctions' as const, label: 'Sanctions', icon: Shield },
    { id: 'stats' as const, label: 'Statistiques', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-cyan-500 text-white p-8 text-center">
            <h1 className="text-3xl font-bold">Panneau d'Administration</h1>
            <p className="mt-2 text-blue-100">Gérez tous les aspects de la plateforme GardFlow</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-blue-900 to-cyan-500 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    <span className="font-medium text-sm text-center leading-tight">{section.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 min-h-[400px]">
              {activeSection === 'users' && <UsersManagement />}
              {activeSection === 'posts' && <PostsManagement />}
              {activeSection === 'salons' && <SalonsValidation />}
              {activeSection === 'annonces' && <AnnoncesManagement />}
              {activeSection === 'commerces' && <CommercesManagement />}
              {activeSection === 'ads' && <AdsManagement />}
              {activeSection === 'reports' && <ReportsManagement />}
              {activeSection === 'sanctions' && <SanctionsManagement />}
              {activeSection === 'stats' && <Statistics />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UserRow {
  id: string;
  username: string;
  email: string | null;
  prenom: string | null;
  nom: string | null;
  full_name: string | null;
  account_type: string | null;
  role: string | null;
  is_active: boolean | null;
  is_verified: boolean | null;
  commune_id: string | null;
  created_at: string;
  activite: string | null;
}

function UsersManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'particulier' | 'professionnel'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('users')
      .select('id, username, email, prenom, nom, full_name, account_type, role, is_active, is_verified, commune_id, created_at, activite', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filterType !== 'all') query = query.eq('account_type', filterType);
    if (filterRole !== 'all') query = query.eq('role', filterRole);
    if (search.trim()) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,prenom.ilike.%${search}%,nom.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (!error && data) {
      setUsers(data as UserRow[]);
      setTotalCount(count ?? data.length);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [filterType, filterRole, search]);

  const toggleActive = async (userId: string, current: boolean | null) => {
    setActionLoading(userId + '-active');
    await supabase.from('users').update({ is_active: !current }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !current } : u));
    setActionLoading(null);
  };

  const toggleRole = async (userId: string, current: string | null) => {
    const newRole = current === 'admin' ? 'user' : 'admin';
    setActionLoading(userId + '-role');
    await supabase.from('users').update({ role: newRole }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setActionLoading(null);
  };

  const displayName = (u: UserRow) => {
    if (u.prenom || u.nom) return `${u.prenom ?? ''} ${u.nom ?? ''}`.trim();
    if (u.full_name) return u.full_name;
    return u.username || '—';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h2>
          <p className="text-sm text-gray-500 mt-1">{totalCount} membre{totalCount > 1 ? 's' : ''} au total</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-64"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'particulier', 'professionnel'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filterType === type ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {type === 'all' ? 'Tous types' : type === 'particulier' ? 'Particuliers' : 'Professionnels'}
          </button>
        ))}
        <div className="w-px bg-gray-200 mx-1" />
        {(['all', 'user', 'admin'] as const).map(role => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filterRole === role ? 'bg-cyan-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {role === 'all' ? 'Tous rôles' : role === 'admin' ? 'Admins' : 'Membres'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Membre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Rôle</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Inscription</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${u.account_type === 'professionnel' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                          {u.account_type === 'professionnel' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 flex items-center gap-1">
                            {displayName(u)}
                            {u.role === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          <div className="text-xs text-gray-400">{u.email || u.username || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.account_type === 'professionnel' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                        {u.account_type === 'professionnel' ? 'Pro' : 'Particulier'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Membre'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active !== false ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle className="w-3 h-3" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                          <Ban className="w-3 h-3" /> Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleRole(u.id, u.role)}
                          disabled={actionLoading === u.id + '-role'}
                          title={u.role === 'admin' ? 'Rétrograder membre' : 'Promouvoir admin'}
                          className={`p-1.5 rounded-lg text-xs transition ${u.role === 'admin' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} disabled:opacity-50`}
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(u.id, u.is_active)}
                          disabled={actionLoading === u.id + '-active'}
                          title={u.is_active !== false ? 'Désactiver le compte' : 'Réactiver le compte'}
                          className={`p-1.5 rounded-lg text-xs transition ${u.is_active !== false ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} disabled:opacity-50`}
                        >
                          {u.is_active !== false ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PostsManagement() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des Publications</h2>
      <p className="text-gray-600 mb-6">Modérez et gérez toutes les publications sur la plateforme.</p>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-gray-500 text-center py-8">Interface de gestion des publications en cours de développement</p>
      </div>
    </div>
  );
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

function SalonsValidation() {
  const { user } = useApp();
  const [pendingSalons, setPendingSalons] = useState<PendingSalon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingSalons();
  }, []);

  const loadPendingSalons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('salons')
      .select('*, users(id, username, prenom, nom, account_type)')
      .eq('status', 'en_attente')
      .order('created_at', { ascending: false });

    if (data) setPendingSalons(data as any);
    setLoading(false);
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
    loadPendingSalons();
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
    loadPendingSalons();
  };

  const deleteSalon = async (salonId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce salon ?')) return;
    await supabase.from('salons').delete().eq('id', salonId);
    loadPendingSalons();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Validation des Salons</h2>
      <p className="text-gray-600 mb-6">Validez ou refusez les demandes de création de salons de discussion.</p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      ) : pendingSalons.length === 0 ? (
        <div className="bg-white rounded-lg p-8 shadow text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Aucun salon en attente de validation</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingSalons.map((salon) => (
            <div key={salon.id} className="bg-white rounded-lg shadow p-5 border border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> En attente
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{salon.name}</h3>
                  {salon.description && (
                    <p className="text-gray-600 text-sm mt-1">{salon.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Créé par{' '}
                    <span className="font-medium text-gray-600">
                      {salon.users?.prenom
                        ? `${salon.users.prenom} ${salon.users.nom || ''}`.trim()
                        : salon.users?.username}
                    </span>
                    {' '}· {new Date(salon.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => validateSalon(salon.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition"
                  >
                    <CheckCircle className="w-4 h-4" /> Valider
                  </button>
                  <button
                    onClick={() => rejectSalon(salon.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition"
                  >
                    <XCircle className="w-4 h-4" /> Refuser
                  </button>
                  <button
                    onClick={() => deleteSalon(salon.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnnoncesManagement() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des Annonces</h2>
      <p className="text-gray-600 mb-6">Modérez et gérez les petites annonces publiées par les utilisateurs.</p>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-gray-500 text-center py-8">Interface de gestion des annonces en cours de développement</p>
      </div>
    </div>
  );
}

function CommercesManagement() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des Commerces</h2>
      <p className="text-gray-600 mb-6">Gérez les fiches commerces et leurs informations.</p>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-gray-500 text-center py-8">Interface de gestion des commerces en cours de développement</p>
      </div>
    </div>
  );
}

function AdsManagement() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des Publicités</h2>
      <p className="text-gray-600 mb-6">Gérez les campagnes publicitaires et les annonceurs.</p>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-gray-500 text-center py-8">Interface de gestion des publicités en cours de développement</p>
      </div>
    </div>
  );
}

function ReportsManagement() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des Signalements</h2>
      <p className="text-gray-600 mb-6">Traitez les signalements de contenu inapproprié ou d'utilisateurs problématiques.</p>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-gray-500 text-center py-8">Interface de gestion des signalements en cours de développement</p>
      </div>
    </div>
  );
}

function SanctionsManagement() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des Sanctions</h2>
      <p className="text-gray-600 mb-6">Consultez et gérez les sanctions appliquées aux utilisateurs.</p>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-gray-500 text-center py-8">Interface de gestion des sanctions en cours de développement</p>
      </div>
    </div>
  );
}

function Statistics() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Statistiques</h2>
      <p className="text-gray-600 mb-6">Consultez les statistiques de la plateforme et les indicateurs clés.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Utilisateurs</h3>
          <p className="text-3xl font-bold text-blue-600">1,234</p>
          <p className="text-sm text-gray-500 mt-1">Total inscrits</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Publications</h3>
          <p className="text-3xl font-bold text-cyan-600">5,678</p>
          <p className="text-sm text-gray-500 mt-1">Total créées</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Salons actifs</h3>
          <p className="text-3xl font-bold text-green-600">89</p>
          <p className="text-sm text-gray-500 mt-1">En activité</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Signalements</h3>
          <p className="text-3xl font-bold text-orange-600">12</p>
          <p className="text-sm text-gray-500 mt-1">En attente</p>
        </div>
      </div>
    </div>
  );
}
