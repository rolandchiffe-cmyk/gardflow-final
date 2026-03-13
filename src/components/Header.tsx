import { Menu, Bell, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useState } from 'react';
import BottomSheetMenu from './BottomSheetMenu';

export default function Header() {
  const { user, pendingModerationCount, currentPage, setCurrentPage } = useApp();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const showBackButton = currentPage !== 'home';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-900 to-cyan-500 text-white z-40">
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
          <div className="flex items-center gap-2">
            <button className="relative p-2 hover:bg-white/10 rounded-full transition">
              <Bell className="w-5 h-5" />
              {pendingModerationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setShowMenu(true)}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <BottomSheetMenu open={showMenu} onClose={() => setShowMenu(false)} />
    </>
  );
}
