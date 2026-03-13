import { Home, MessageSquare, Users, ShoppingBag, Store, Heart, Calendar, User, Map, Newspaper } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function MobileNav() {
  const { currentPage, setCurrentPage, user } = useApp();

  const navItems = [
    { id: 'home' as const, icon: Home, label: 'Accueil' },
    { id: 'actualites' as const, icon: Newspaper, label: 'Actus' },
    { id: 'discussions' as const, icon: MessageSquare, label: 'Discussions' },
    { id: 'salons' as const, icon: Users, label: 'Salons' },
    { id: 'annonces' as const, icon: ShoppingBag, label: 'Annonces' },
    { id: 'commerces' as const, icon: Store, label: 'Commerces' },
    { id: 'associations' as const, icon: Heart, label: 'Associations' },
    { id: 'evenements' as const, icon: Calendar, label: 'Événements' },
    { id: 'profile' as const, icon: User, label: 'Profil' },
  ];

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-cyan-500' : 'text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
