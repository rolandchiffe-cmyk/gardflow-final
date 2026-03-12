import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Briefcase } from 'lucide-react';
import ParticulierRegistration from '../components/ParticulierRegistration';
import ProfessionnelRegistration from '../components/ProfessionnelRegistration';
import LoginForm from '../components/LoginForm';

type AuthView = 'choice' | 'particulier' | 'professionnel' | 'login';

export default function AuthPage() {
  const [view, setView] = useState<AuthView>('login');
  const [isLogin, setIsLogin] = useState(true);

  const handleViewChange = (newView: AuthView) => {
    setView(newView);
    setIsLogin(newView === 'login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <img src="/Logo_Grand.jpg" alt="GardFlow" className="h-24 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenue sur GardFlow</h1>
          <p className="text-cyan-100">Le réseau social du Gard Rhodanien</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {view === 'login' && (
            <>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    isLogin ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Connexion
                </button>
                <button
                  onClick={() => handleViewChange('choice')}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    !isLogin ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Inscription
                </button>
              </div>
              <LoginForm />
            </>
          )}

          {view === 'choice' && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => handleViewChange('login')}
                  className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                >
                  ← Retour à la connexion
                </button>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Créer un compte
              </h2>
              <p className="text-gray-600 mb-8 text-center">
                Choisissez le type de compte que vous souhaitez créer
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleViewChange('particulier')}
                  className="flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition group"
                >
                  <div className="w-20 h-20 rounded-full bg-cyan-100 group-hover:bg-cyan-200 flex items-center justify-center transition">
                    <User className="w-10 h-10 text-cyan-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Compte Particulier
                    </h3>
                    <p className="text-sm text-gray-600">
                      Pour les résidents du Gard Rhodanien
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleViewChange('professionnel')}
                  className="flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition group"
                >
                  <div className="w-20 h-20 rounded-full bg-cyan-100 group-hover:bg-cyan-200 flex items-center justify-center transition">
                    <Briefcase className="w-10 h-10 text-cyan-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Compte Professionnel
                    </h3>
                    <p className="text-sm text-gray-600">
                      Pour les entreprises et associations
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}

          {view === 'particulier' && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => handleViewChange('choice')}
                  className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                >
                  ← Retour au choix du compte
                </button>
              </div>
              <ParticulierRegistration />
            </>
          )}

          {view === 'professionnel' && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => handleViewChange('choice')}
                  className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                >
                  ← Retour au choix du compte
                </button>
              </div>
              <ProfessionnelRegistration />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
