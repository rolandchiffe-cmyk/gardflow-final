import { useEffect, useRef } from 'react';
import { MapPin, Newspaper, CalendarDays, Leaf, Heart, ShoppingCart, CircleUser as UserCircle, Settings, X, Home, MessageSquare, Users, ShoppingBag } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Page = 'home' | 'discussions' | 'salons' | 'annonces' | 'commerces' | 'associations' | 'evenements' | 'actualites' | 'agriculteurs' | 'profile' | 'moderation' | 'admin' | 'carte';

interface TileItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  badge?: number | null;
}

interface Section {
  title: string;
  items: TileItem[];
}

export default function BottomSheetMenu({ open, onClose }: Props) {
  const { setCurrentPage, currentPage, userRole, pendingModerationCount } = useApp();
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentYRef.current = e.touches[0].clientY;
    if (sheetRef.current && startYRef.current !== null) {
      const delta = currentYRef.current - startYRef.current;
      if (delta > 0) {
        sheetRef.current.style.transform = `translateY(${delta}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (sheetRef.current && startYRef.current !== null && currentYRef.current !== null) {
      const delta = currentYRef.current - startYRef.current;
      sheetRef.current.style.transform = '';
      if (delta > 80) {
        onClose();
      }
    }
    startYRef.current = null;
    currentYRef.current = null;
  };

  const navigate = (id: Page) => {
    setCurrentPage(id);
    onClose();
  };

  const sections: Section[] = [
    {
      title: 'Mon Quotidien',
      items: [
        { id: 'carte', label: 'Carte', icon: MapPin, color: '#0047AB', bg: '#EEF3FF' },
        { id: 'actualites', label: 'Actualités Locales', icon: Newspaper, color: '#00CED1', bg: '#E0FAFA' },
        { id: 'evenements', label: 'Événements', icon: CalendarDays, color: '#FF5733', bg: '#FFF0ED' },
        { id: 'home', label: 'Accueil', icon: Home, color: '#0047AB', bg: '#EEF3FF' },
      ],
    },
    {
      title: 'Tissu Local',
      items: [
        { id: 'agriculteurs', label: 'Exploitants Agricoles', icon: Leaf, color: '#2ECC71', bg: '#EAFAF1' },
        { id: 'associations', label: 'Associations', icon: Heart, color: '#E91E63', bg: '#FCE4EC' },
        { id: 'commerces', label: 'Commerces & Artisans', icon: ShoppingCart, color: '#00A896', bg: '#E0F5F3' },
        { id: 'annonces', label: 'Annonces', icon: ShoppingBag, color: '#FF7043', bg: '#FFF3E0' },
      ],
    },
    {
      title: 'Communauté',
      items: [
        { id: 'discussions', label: 'Discussions', icon: MessageSquare, color: '#1565C0', bg: '#E3F2FD' },
        { id: 'salons', label: 'Salons', icon: Users, color: '#6D4C41', bg: '#EFEBE9' },
        { id: 'profile', label: 'Mon Profil', icon: UserCircle, color: '#333333', bg: '#F5F5F5' },
        ...(userRole === 'admin' ? [{
          id: 'admin' as Page,
          label: 'Administration',
          icon: Settings,
          color: '#CC0000',
          bg: '#FFEBEE',
          badge: pendingModerationCount,
        }] : []),
      ],
    },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-400 ease-out will-change-transform`}
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="bg-white shadow-2xl overflow-y-auto max-h-[70vh]"
          style={{ borderRadius: '30px 30px 0 0' }}
        >
          <div className="flex flex-col items-center pt-3 pb-1 sticky top-0 bg-white z-10">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full mb-3" />
            <div className="w-full flex items-center justify-between px-5 pb-2">
              <span className="text-base font-bold text-gray-800 tracking-tight">Menu</span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="px-4 pb-8 space-y-5">
            {sections.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  {section.title}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className="relative flex items-center gap-3 p-3 rounded-2xl transition-all duration-150 active:scale-95 text-left"
                        style={{
                          backgroundColor: isActive ? item.bg : '#F9FAFB',
                          boxShadow: isActive ? `0 0 0 2px ${item.color}33` : 'none',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = item.bg)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = isActive ? item.bg : '#F9FAFB')}
                      >
                        <div
                          className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
                          style={{ backgroundColor: item.bg }}
                        >
                          <Icon className="w-5 h-5" style={{ color: item.color }} />
                        </div>
                        <span
                          className="text-sm font-semibold leading-tight"
                          style={{ color: isActive ? item.color : '#374151' }}
                        >
                          {item.label}
                        </span>
                        {item.badge != null && item.badge > 0 && (
                          <span className="absolute top-2 right-2 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
