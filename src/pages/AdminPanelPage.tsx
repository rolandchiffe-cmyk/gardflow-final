import { useState, useEffect } from 'react';
import { Users, FileText, MessageSquare, ShoppingBag, Store, Megaphone, AlertTriangle, Shield, BarChart3, Search, User, Building2, CheckCircle, Ban, Crown, XCircle, Trash2, Clock, Flag, Mail, Phone, ChevronDown, ChevronUp, Newspaper, Plus, Rss, Trash, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';

type AdminSection = 'users' | 'posts' | 'salons' | 'annonces' | 'commerces' | 'associations' | 'actualites' | 'ads' | 'reports' | 'sanctions' | 'stats';

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
    { id: 'associations' as const, label: 'Associations', icon: Building2 },
    { id: 'actualites' as const, label: 'Actualités', icon: Newspaper },
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
              {activeSection === 'associations' && <AssociationsManagement />}
              {activeSection === 'actualites' && <ActualitesManagement />}
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
      .select('*, users!salons_created_by_fkey(id, username, prenom, nom, account_type)')
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
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> En attente
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 break-words">{salon.name}</h3>
                    {salon.description && (
                      <p className="text-gray-600 text-sm mt-1 break-words">{salon.description}</p>
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
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => validateSalon(salon.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition"
                  >
                    <CheckCircle className="w-4 h-4" /> Valider
                  </button>
                  <button
                    onClick={() => rejectSalon(salon.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition"
                  >
                    <XCircle className="w-4 h-4" /> Refuser
                  </button>
                  <button
                    onClick={() => deleteSalon(salon.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer
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

interface AssociationRow {
  id: string;
  name: string;
  category: string | null;
  commune_name: string | null;
  postal_code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
}

interface ClaimRow {
  id: string;
  association_id: string;
  association_name: string;
  prenom: string;
  nom: string;
  email: string;
  phone: string | null;
  role_in_association: string;
  message: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

function AssociationsManagement() {
  const [tab, setTab] = useState<'list' | 'claims'>('claims');
  const [associations, setAssociations] = useState<AssociationRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loadingAssoc, setLoadingAssoc] = useState(false);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [search, setSearch] = useState('');
  const [claimsFilter, setClaimsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'list') fetchAssociations();
    else fetchClaims();
  }, [tab, claimsFilter]);

  const fetchAssociations = async () => {
    setLoadingAssoc(true);
    let q = supabase.from('associations').select('id, name, category, commune_name, postal_code, contact_email, contact_phone, address').order('name');
    if (search.trim()) q = q.ilike('name', `%${search}%`);
    const { data } = await q;
    if (data) setAssociations(data);
    setLoadingAssoc(false);
  };

  useEffect(() => {
    if (tab === 'list') fetchAssociations();
  }, [search]);

  const fetchClaims = async () => {
    setLoadingClaims(true);
    let q = supabase.from('association_claims').select('*').order('created_at', { ascending: false });
    if (claimsFilter !== 'all') q = q.eq('status', claimsFilter);
    const { data } = await q;
    if (data) setClaims(data as ClaimRow[]);
    setLoadingClaims(false);
  };

  const updateClaimStatus = async (claimId: string, status: 'approved' | 'rejected', note?: string) => {
    setActionLoading(claimId);
    await supabase.from('association_claims').update({ status, admin_note: note ?? '', updated_at: new Date().toISOString() }).eq('id', claimId);
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status } : c));
    setActionLoading(null);
  };

  const handleApprove = (claimId: string) => updateClaimStatus(claimId, 'approved');
  const handleReject = (claimId: string) => {
    const note = prompt('Raison du refus (facultatif) :') ?? '';
    updateClaimStatus(claimId, 'rejected', note);
  };

  const CATEGORY_COLORS: Record<string, string> = {
    Culture: 'bg-blue-100 text-blue-700', Sport: 'bg-green-100 text-green-700',
    Education: 'bg-yellow-100 text-yellow-700', Environnement: 'bg-emerald-100 text-emerald-700',
    Patrimoine: 'bg-amber-100 text-amber-700', Loisirs: 'bg-orange-100 text-orange-700',
    Animation: 'bg-pink-100 text-pink-700', Musique: 'bg-violet-100 text-violet-700',
    Solidarité: 'bg-red-100 text-red-700', Jeunesse: 'bg-cyan-100 text-cyan-700',
  };

  const pendingCount = claims.filter(c => c.status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Associations</h2>
          <p className="text-sm text-gray-500 mt-1">Gérez les fiches associations et les demandes de revendication.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('claims')}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'claims' ? 'bg-amber-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          <Flag className="w-4 h-4" />
          Revendications
          {pendingCount > 0 && tab !== 'claims' && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'list' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          <Building2 className="w-4 h-4" />
          Liste des associations
        </button>
      </div>

      {tab === 'claims' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setClaimsFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${claimsFilter === f
                  ? f === 'pending' ? 'bg-amber-500 text-white'
                    : f === 'approved' ? 'bg-green-500 text-white'
                    : f === 'rejected' ? 'bg-red-500 text-white'
                    : 'bg-gray-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {f === 'pending' ? 'En attente' : f === 'approved' ? 'Approuvées' : f === 'rejected' ? 'Refusées' : 'Toutes'}
              </button>
            ))}
          </div>

          {loadingClaims ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-gray-100">
              <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune demande de revendication</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map(claim => (
                <div key={claim.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            claim.status === 'pending' ? 'bg-amber-100 text-amber-700'
                            : claim.status === 'approved' ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                          }`}>
                            {claim.status === 'pending' ? <Clock className="w-3 h-3" /> : claim.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {claim.status === 'pending' ? 'En attente' : claim.status === 'approved' ? 'Approuvée' : 'Refusée'}
                          </span>
                          <span className="text-xs text-gray-400">{new Date(claim.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <p className="font-semibold text-gray-800 text-sm truncate">{claim.association_name || 'Association sans nom'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {claim.prenom} {claim.nom} — <span className="italic">{claim.role_in_association}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => setExpandedClaim(expandedClaim === claim.id ? null : claim.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                      >
                        {expandedClaim === claim.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {expandedClaim === claim.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <a href={`mailto:${claim.email}`} className="text-teal-600 hover:underline truncate">{claim.email}</a>
                        </div>
                        {claim.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {claim.phone}
                          </div>
                        )}
                        {claim.message && (
                          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic">"{claim.message}"</p>
                        )}
                        {claim.admin_note && (
                          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">Note admin : {claim.admin_note}</p>
                        )}
                      </div>
                    )}

                    {claim.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApprove(claim.id)}
                          disabled={actionLoading === claim.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approuver
                        </button>
                        <button
                          onClick={() => handleReject(claim.id)}
                          disabled={actionLoading === claim.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'list' && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une association..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
          </div>

          {loadingAssoc ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Association</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Catégorie</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Commune</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {associations.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 text-sm">{a.name}</p>
                          {a.address && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{a.address}</p>}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {a.category && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[a.category] ?? 'bg-gray-100 text-gray-600'}`}>
                              {a.category}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                          {[a.commune_name, a.postal_code].filter(Boolean).join(' ')}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="space-y-0.5">
                            {a.contact_email && (
                              <a href={`mailto:${a.contact_email}`} className="flex items-center gap-1 text-xs text-teal-600 hover:underline">
                                <Mail className="w-3 h-3" /> <span className="truncate max-w-[160px]">{a.contact_email}</span>
                              </a>
                            )}
                            {a.contact_phone && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="w-3 h-3" /> {a.contact_phone}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {associations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-gray-400">
                          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          Aucune association trouvée
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RssFeed {
  id: string;
  title: string;
  url: string;
  category: string;
  is_active: boolean;
  last_fetched_at: string | null;
  created_at: string;
}

function ActualitesManagement() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => { loadFeeds(); }, []);

  const loadFeeds = async () => {
    setLoading(true);
    const { data } = await supabase.from('rss_feeds').select('*').order('created_at', { ascending: false });
    if (data) setFeeds(data as RssFeed[]);
    setLoading(false);
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) { setFormError('Le titre et l\'URL sont obligatoires.'); return; }
    setSaving(true);
    setFormError('');
    const { error } = await supabase.from('rss_feeds').insert({ title: form.title.trim(), url: form.url.trim(), category: form.category.trim() });
    if (error) { setFormError('Erreur lors de l\'ajout du flux.'); } else {
      setForm({ title: '', url: '', category: '' });
      setShowForm(false);
      await loadFeeds();
    }
    setSaving(false);
  };

  const toggleActive = async (feed: RssFeed) => {
    await supabase.from('rss_feeds').update({ is_active: !feed.is_active }).eq('id', feed.id);
    setFeeds(prev => prev.map(f => f.id === feed.id ? { ...f, is_active: !f.is_active } : f));
  };

  const deleteFeed = async (id: string) => {
    if (!confirm('Supprimer ce flux et toutes ses actualités ?')) return;
    await supabase.from('rss_feeds').delete().eq('id', id);
    setFeeds(prev => prev.filter(f => f.id !== id));
  };

  const fetchAll = async () => {
    setFetching(true);
    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-rss`,
        { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } }
      );
      await loadFeeds();
    } catch (_) {}
    setFetching(false);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Actualités Locales</h2>
          <p className="text-sm text-gray-500 mt-1">Gérez les flux RSS pour les actualités affichées sur l'accueil.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            disabled={fetching}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Ajouter un flux
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddFeed} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 space-y-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Rss className="w-4 h-4 text-teal-600" /> Nouveau flux RSS
          </h3>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Nom du flux <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Midi Libre - Gard"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">URL du flux RSS <span className="text-red-500">*</span></label>
            <input
              type="url"
              value={form.url}
              onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
              placeholder="https://www.example.com/rss.xml"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Catégorie</label>
            <input
              type="text"
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              placeholder="Ex: Sport, Politique, Culture..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
        </div>
      ) : feeds.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-gray-100">
          <Rss className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun flux RSS configuré</p>
          <p className="text-sm text-gray-400 mt-1">Cliquez sur "Ajouter un flux" pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feeds.map(feed => (
            <div key={feed.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${feed.is_active ? 'bg-teal-50' : 'bg-gray-100'}`}>
                    <Rss className={`w-5 h-5 ${feed.is_active ? 'text-teal-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 text-sm">{feed.title}</p>
                      {feed.category && (
                        <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">{feed.category}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${feed.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {feed.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{feed.url}</p>
                    {feed.last_fetched_at && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Dernière mise à jour : {new Date(feed.last_fetched_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(feed)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title={feed.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {feed.is_active
                      ? <ToggleRight className="w-5 h-5 text-teal-500" />
                      : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => deleteFeed(feed.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                    title="Supprimer"
                  >
                    <Trash className="w-4 h-4" />
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
