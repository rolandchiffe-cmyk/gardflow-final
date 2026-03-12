import { TrendingUp, Users, Calendar, MapPin } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function HomePage() {
  const { setCurrentPage } = useApp();

  const highlights = [
    {
      id: 'discussions',
      title: 'Discussions',
      description: 'Partagez vos idées avec la communauté',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'salons',
      title: 'Salons',
      description: 'Rejoignez des groupes de discussion',
      icon: Users,
      color: 'from-teal-500 to-green-500',
    },
    {
      id: 'evenements',
      title: 'Événements',
      description: 'Découvrez les événements locaux',
      icon: Calendar,
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'commerces',
      title: 'Commerces',
      description: 'Soutenez les commerces locaux',
      icon: MapPin,
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-cyan-500 text-white p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-2">Bienvenue sur GardFlow</h2>
        <p className="text-cyan-100">
          Connectez-vous avec votre communauté locale dans le Gard Rhodanien
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as any)}
              className={`bg-gradient-to-br ${item.color} text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1`}
            >
              <Icon className="w-8 h-8 mb-3" />
              <h3 className="font-bold mb-1">{item.title}</h3>
              <p className="text-xs opacity-90">{item.description}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Activité récente</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">Nouvelle discussion</p>
                <p className="text-sm text-gray-500">Il y a {i} heure{i > 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
