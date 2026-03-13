import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Users, CheckCircle, ArrowRight } from 'lucide-react';

const COMMUNES = [
  'Aiguèze',
  'Bagnols-sur-Cèze',
  'Carsan',
  'Cavillargues',
  'Chusclan',
  'Codolet',
  'Connaux',
  'Cornillon',
  'Gaujac',
  'Goudargues',
  'Issirac',
  'La Roque-sur-Cèze',
  'Laudun-l\'Ardoise',
  'Laval-Saint-Roman',
  'Le Garn',
  'Le Pin',
  'Lirac',
  'Montclus',
  'Montfaucon',
  'Orsan',
  'Pont-Saint-Esprit',
  'Sabran',
  'Saint-Alexandre',
  'Saint-André d\'Olérargues',
  'Saint-André de Roquepertuis',
  'Saint-Christol de Rodières',
  'Saint-Etienne des Sorts',
  'Saint-Geniès de Comolas',
  'Saint-Gervais',
  'Saint-Julien de Peyrolas',
  'Saint-Laurent de Carnols',
  'Saint-Marcel de Careiret',
  'Saint-Michel d\'Euzet',
  'Saint-Nazaire',
  'Saint-Paul les Fonts',
  'Saint-Pons la Calm',
  'Saint-Victor la Coste',
  'Salazac',
  'Sauzet',
  'Tresques',
  'Valliguières',
  'Vénéjan',
  'Verfeuil',
  'Autre commune',
];

export default function PreInscriptionPage() {
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [commune, setCommune] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetchCount();
  }, []);

  const fetchCount = async () => {
    const { count: total } = await supabase
      .from('preinscriptions')
      .select('*', { count: 'exact', head: true });
    setCount(total ?? 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: insertError } = await supabase
      .from('preinscriptions')
      .insert({ prenom, email, commune, username: email.split('@')[0] + '_' + Date.now() });

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Cet email est déjà pré-inscrit.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
    fetchCount();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-600 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-400 opacity-10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <img
            src="/Logo_Grand.jpg"
            alt="GardFlow"
            className="h-20 mx-auto mb-6 rounded-2xl shadow-2xl"
          />
          <div className="inline-flex items-center gap-2 bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-sm font-medium px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Lancement imminent
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
            GardFlow arrive bientôt
          </h1>
          <p className="text-cyan-100 text-lg font-medium leading-relaxed mb-4">
            Le réseau local du Gard Rhodanien.
          </p>
          <p className="text-cyan-200/80 text-sm leading-relaxed max-w-sm mx-auto">
            L'application est en préparation. Pré-inscrivez-vous pour être averti dès l'ouverture officielle.
          </p>
        </div>

        {count !== null && (
          <div className="flex items-center justify-center gap-3 mb-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl py-4 px-6">
            <Users className="w-5 h-5 text-cyan-300 flex-shrink-0" />
            <p className="text-white font-medium">
              <span className="text-cyan-300 font-bold text-xl">{count}</span>
              {' '}personne{count > 1 ? 's' : ''} déjà pré-inscrite{count > 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                Merci pour votre pre-inscription !
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Vous serez averti des le lancement de GardFlow.
              </p>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-400">
                  Partagez GardFlow autour de vous
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Pre-inscrivez-vous
              </h2>
              <p className="text-gray-500 text-sm text-center mb-6">
                Soyez parmi les premiers a rejoindre la communaute
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prenom
                  </label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                    placeholder="Votre prenom"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="votre@email.fr"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1 text-blue-500" />
                    Commune
                  </label>
                  <select
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 text-gray-900 appearance-none cursor-pointer"
                  >
                    <option value="">Selectionnez votre commune</option>
                    {COMMUNES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Je me pre-inscris
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

            </>
          )}
        </div>

        <p className="text-center text-cyan-200/60 text-xs mt-6">
          Vos donnees ne seront utilisees que pour vous informer du lancement.
        </p>

        <div className="text-center mt-4">
          <a
            href="/admin-login"
            className="text-white/20 hover:text-white/40 text-xs transition-colors duration-300"
          >
            Connexion administrateur
          </a>
        </div>
      </div>
    </div>
  );
}
