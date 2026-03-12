import { useState, useEffect } from 'react';
import { User, LogOut, Mail, Calendar, CreditCard as Edit2, Check, X, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';

type ActiveSection = 'view' | 'edit' | 'password';

export default function ProfilePage() {
  const { user, userProfile, signOut, refreshProfile } = useApp();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('view');

  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    prenom: '',
    nom: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (userProfile) {
      setEditForm({
        full_name: userProfile.full_name || '',
        username: userProfile.username || '',
        bio: userProfile.bio || '',
        prenom: userProfile.prenom || '',
        nom: userProfile.nom || '',
      });
      setLoading(false);
    } else if (user) {
      setLoading(false);
    }
  }, [userProfile, user]);

  const handleEditSave = async () => {
    if (!user) return;
    setEditSaving(true);
    setEditError('');
    setEditSuccess('');

    if (!editForm.username.trim()) {
      setEditError("Le nom d'utilisateur est obligatoire.");
      setEditSaving(false);
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({
        full_name: editForm.full_name.trim() || null,
        username: editForm.username.trim(),
        bio: editForm.bio.trim() || null,
        prenom: editForm.prenom.trim() || null,
        nom: editForm.nom.trim() || null,
      })
      .eq('id', user.id);

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        setEditError("Ce nom d'utilisateur est déjà pris.");
      } else {
        setEditError("Une erreur est survenue. Veuillez réessayer.");
      }
    } else {
      await refreshProfile();
      setEditSuccess('Profil mis à jour avec succès.');
      setTimeout(() => {
        setEditSuccess('');
        setActiveSection('view');
      }, 1500);
    }
    setEditSaving(false);
  };

  const handlePasswordSave = async () => {
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.next || passwordForm.next.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      setPasswordSaving(false);
      return;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      setPasswordSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: passwordForm.next });

    if (error) {
      setPasswordError("Impossible de modifier le mot de passe. Veuillez vous reconnecter et réessayer.");
    } else {
      setPasswordSuccess('Mot de passe modifié avec succès.');
      setPasswordForm({ current: '', next: '', confirm: '' });
      setTimeout(() => {
        setPasswordSuccess('');
        setActiveSection('view');
      }, 2000);
    }
    setPasswordSaving(false);
  };

  const cancelEdit = () => {
    if (userProfile) {
      setEditForm({
        full_name: userProfile.full_name || '',
        username: userProfile.username || '',
        bio: userProfile.bio || '',
        prenom: userProfile.prenom || '',
        nom: userProfile.nom || '',
      });
    }
    setEditError('');
    setEditSuccess('');
    setActiveSection('view');
  };

  const cancelPassword = () => {
    setPasswordForm({ current: '', next: '', confirm: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setActiveSection('view');
  };

  const displayName = userProfile?.full_name || userProfile?.username || user?.email?.split('@')[0] || 'U';
  const initial = displayName[0]?.toUpperCase() || 'U';

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-8">
      <h1 className="text-2xl font-bold text-gray-800">Profil</h1>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-md">
            {initial}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{displayName}</h2>
          <p className="text-sm text-gray-500">@{userProfile?.username}</p>
        </div>

        {activeSection === 'view' && (
          <>
            {userProfile?.bio && (
              <p className="text-gray-600 text-center text-sm mb-4 italic">"{userProfile.bio}"</p>
            )}
            <div className="space-y-2 text-sm text-gray-600 mb-5">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span>
                  Membre depuis{' '}
                  {userProfile?.created_at
                    ? new Date(userProfile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                    : '—'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveSection('edit')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-cyan-500 text-cyan-600 rounded-lg font-medium hover:bg-cyan-50 transition"
              >
                <Edit2 className="w-4 h-4" />
                Modifier le profil
              </button>
              <button
                onClick={() => setActiveSection('password')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                <Lock className="w-4 h-4" />
                Changer le mot de passe
              </button>
            </div>
          </>
        )}

        {activeSection === 'edit' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-cyan-500" />
              Modifier le profil
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prénom</label>
                <input
                  type="text"
                  value={editForm.prenom}
                  onChange={(e) => setEditForm(f => ({ ...f, prenom: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Prénom"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
                <input
                  type="text"
                  value={editForm.nom}
                  onChange={(e) => setEditForm(f => ({ ...f, nom: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Nom"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom d'affichage</label>
              <input
                type="text"
                value={editForm.full_name}
                onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Nom complet affiché"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom d'utilisateur <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="utilisateur"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                maxLength={200}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                placeholder="Décrivez-vous en quelques mots..."
              />
              <p className="text-xs text-gray-400 text-right">{editForm.bio.length}/200</p>
            </div>

            {editError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {editError}
              </div>
            )}
            {editSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {editSuccess}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition disabled:opacity-60"
              >
                {editSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Enregistrer
              </button>
              <button
                onClick={cancelEdit}
                disabled={editSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        )}

        {activeSection === 'password' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-500" />
              Changer le mot de passe
            </h3>

            {[
              { key: 'next' as const, label: 'Nouveau mot de passe', placeholder: 'Minimum 6 caractères' },
              { key: 'confirm' as const, label: 'Confirmer le nouveau mot de passe', placeholder: 'Répétez le mot de passe' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <div className="relative">
                  <input
                    type={showPasswords[key] ? 'text' : 'password'}
                    value={passwordForm[key]}
                    onChange={(e) => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder={placeholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(s => ({ ...s, [key]: !s[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            {passwordError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {passwordSuccess}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handlePasswordSave}
                disabled={passwordSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition disabled:opacity-60"
              >
                {passwordSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Modifier
              </button>
              <button
                onClick={cancelPassword}
                disabled={passwordSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={signOut}
        className="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition flex items-center justify-center gap-2 shadow"
      >
        <LogOut className="w-5 h-5" />
        Se déconnecter
      </button>
    </div>
  );
}
