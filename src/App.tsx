import { AppProvider, useApp } from './contexts/AppContext';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import DiscussionsPage from './pages/DiscussionsPage';
import SalonsPage from './pages/SalonsPage';
import AnnoncesPage from './pages/AnnoncesPage';
import CommercesPage from './pages/CommercesPage';
import AssociationsPage from './pages/AssociationsPage';
import EvenementsPage from './pages/EvenementsPage';
import ProfilePage from './pages/ProfilePage';
import ModerationPage from './pages/ModerationPage';
import AdminPanelPage from './pages/AdminPanelPage';
import CartePage from './pages/CartePage';
import PreInscriptionPage from './pages/PreInscriptionPage';
import ActualitesPage from './pages/ActualitesPage';
import AgriculteurPage from './pages/AgriculteurPage';

function AppContent() {
  const { currentPage, user, loading } = useApp();

  const isAdminLogin = window.location.pathname === '/admin-login';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-cyan-500 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (isAdminLogin) {
      return <AuthPage />;
    }
    return <PreInscriptionPage />;
  }

  const pages = {
    home: HomePage,
    discussions: DiscussionsPage,
    salons: SalonsPage,
    annonces: AnnoncesPage,
    commerces: CommercesPage,
    associations: AssociationsPage,
    evenements: EvenementsPage,
    actualites: ActualitesPage,
    agriculteurs: AgriculteurPage,
    profile: ProfilePage,
    moderation: ModerationPage,
    admin: AdminPanelPage,
    carte: CartePage,
  };

  const CurrentPage = pages[currentPage];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <main className="pt-20 px-4 max-w-lg mx-auto">
        <CurrentPage />
      </main>
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider> 
  );
}

export default App;
