import { Home, Newspaper, ShoppingBag, User } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function MobileNav() {
  const { currentPage, setCurrentPage, user } = useApp();

  const leftItems = [
    { id: 'home' as const, icon: Home, label: 'Accueil' },
    { id: 'actualites' as const, icon: Newspaper, label: 'Actus' },
  ];

  const rightItems = [
    { id: 'annonces' as const, icon: ShoppingBag, label: 'Annonces' },
    { id: 'profile' as const, icon: User, label: 'Profil' },
  ];

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-end h-16 max-w-lg mx-auto px-2 pb-1">
        {leftItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full pb-1 transition-colors ${
                isActive ? 'text-cyan-500' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}

        <div className="flex flex-col items-center justify-end flex-1 relative">
          <button
            onClick={() => setCurrentPage('home')}
            className="absolute flex items-center justify-center w-[4.5rem] h-[4.5rem] rounded-full bg-white shadow-xl hover:scale-105 transition-transform"
            style={{ bottom: '6px' }}
          >
            <img
              src="/Gemini_Generated_Image_bz6jcqbz6jcqbz6j.png"
              alt="Gardbook"
              className="w-[3.75rem] h-[3.75rem] object-contain rounded-full"
            />
          </button>
        </div>

        {rightItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full pb-1 transition-colors ${
                isActive ? 'text-cyan-500' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
            oh
          );
        })}
      </div>
    </nav>
  );
}
