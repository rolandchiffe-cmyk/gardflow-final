import { Menu, Bell, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useState } from 'react';

export default function Header() {
  const { user, userRole, currentPage, setCurrentPage } = useApp();
  const [showMenu, setShowMenu] = useState(false);

  const menuItems = [
    { id: 'carte' as const, label: 'Carte' },
    { id: 'associations' as const, label: 'Associations' },
    { id: 'evenements' as const, label: 'Événements' },
    { id: 'messages' as const, label: 'Messages' },
    { id: 'profile' as const, label: 'Profil' },
    ...(userRole === 'admin' ? [
      { id: 'moderation' as const, label: 'Modération' },
      { id: 'admin' as const, label: 'Administration' }
    ] : []),
  ];

  if (!user) return null;

  const showBackButton = currentPage !== 'home';

  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-900 to-cyan-500 text-white z-50">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={() => setCurrentPage('home')}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <img src="/Logo_Grand.jpg" alt="GardFlow" className="h-10 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 rounded-full transition">
            <Bell className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
