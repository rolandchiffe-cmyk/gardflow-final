import { useState } from 'react';
import { X, Flag, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';

interface Props {
  associationId: string;
  associationName: string;
  onClose: () => void;
}

export default function ClaimAssociationModal({ associationId, associationName, onClose }: Props) {
  const { user } = useApp();
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    phone: '',
    role_in_association: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.email || !form.role_in_association) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: dbError } = await supabase.from('association_claims').insert({
      association_id: associationId,
      association_name: associationName,
      nom: form.nom,
      prenom: form.prenom,
      email: form.email,
      phone: form.phone,
      role_in_association: form.role_in_association,
      message: form.message,
      user_id: user?.id ?? null,
      status: 'pending',
    });
    setLoading(false);
    if (dbError) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Flag className="w-5 h-5" />
            <h2 className="font-bold text-lg">Revendiquer cette association</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">Demande envoyée !</h3>
              <p className="text-sm text-gray-500 mb-4">
                Votre demande de revendication pour <strong>{associationName}</strong> a bien été reçue. Un administrateur la traitera prochainement.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition"
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Vous souhaitez revendiquer la fiche de <strong className="text-gray-800">{associationName}</strong> ? Remplissez ce formulaire pour contacter notre équipe.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Prénom <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    placeholder="Votre prénom"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Nom <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contact@votreassociation.fr"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="06 XX XX XX XX"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Votre rôle dans l'association <span className="text-red-500">*</span></label>
                <select
                  name="role_in_association"
                  value={form.role_in_association}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-gray-700"
                >
                  <option value="">Sélectionner votre rôle</option>
                  <option value="Président(e)">Président(e)</option>
                  <option value="Vice-Président(e)">Vice-Président(e)</option>
                  <option value="Secrétaire">Secrétaire</option>
                  <option value="Trésorier(e)">Trésorier(e)</option>
                  <option value="Membre du bureau">Membre du bureau</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Message (facultatif)</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Informations complémentaires pour justifier votre demande..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  Envoyer la demande
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
