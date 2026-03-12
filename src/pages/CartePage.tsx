import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Map, MapPin, Calendar, Store, ShoppingBag, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type FilterType = 'all' | 'events' | 'commerces' | 'annonces' | 'associations';

interface MapItem {
  id: string;
  type: 'event' | 'commerce' | 'annonce' | 'association' | 'ad';
  name: string;
  commune: string;
  latitude: number;
  longitude: number;
  photo?: string;
  description?: string;
}

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

const BAGNOLS_CENTER: [number, number] = [44.1623, 4.6203];
const DEFAULT_ZOOM = 11;

export default function CartePage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [mapItems, setMapItems] = useState<MapItem[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(BAGNOLS_CENTER);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userPos);
          setMapCenter(userPos);
        },
        () => {
          setMapCenter(BAGNOLS_CENTER);
        }
      );
    } else {
      setMapCenter(BAGNOLS_CENTER);
    }
  }, []);

  useEffect(() => {
    loadMapItems();
  }, []);

  const loadMapItems = async () => {
    setLoading(true);
    const items: MapItem[] = [];

    try {
      const { data: events } = await supabase
        .from('events')
        .select('id, name, commune_id, latitude, longitude, image_url, description')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      const { data: commerces } = await supabase
        .from('commerces')
        .select('id, name, commune_id, latitude, longitude, logo_url, description')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      const { data: annonces } = await supabase
        .from('annonces')
        .select('id, title, commune_id, latitude, longitude, images, description')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      const { data: associations } = await supabase
        .from('associations')
        .select('id, name, commune_id, latitude, longitude, logo_url, description')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      const { data: ads } = await supabase
        .from('publicites')
        .select('id, title, commune_id, latitude, longitude, image_url, description')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      const { data: communes } = await supabase
        .from('communes')
        .select('id, name');

      const communeMap = new Map(communes?.map(c => [c.id, c.name]) || []);

      if (events) {
        events.forEach(event => {
          items.push({
            id: `event-${event.id}`,
            type: 'event',
            name: event.name,
            commune: communeMap.get(event.commune_id) || 'Non spécifié',
            latitude: event.latitude,
            longitude: event.longitude,
            photo: event.image_url,
            description: event.description
          });
        });
      }

      if (commerces) {
        commerces.forEach(commerce => {
          items.push({
            id: `commerce-${commerce.id}`,
            type: 'commerce',
            name: commerce.name,
            commune: communeMap.get(commerce.commune_id) || 'Non spécifié',
            latitude: commerce.latitude,
            longitude: commerce.longitude,
            photo: commerce.logo_url,
            description: commerce.description
          });
        });
      }

      if (annonces) {
        annonces.forEach(annonce => {
          items.push({
            id: `annonce-${annonce.id}`,
            type: 'annonce',
            name: annonce.title,
            commune: communeMap.get(annonce.commune_id) || 'Non spécifié',
            latitude: annonce.latitude,
            longitude: annonce.longitude,
            photo: annonce.images?.[0],
            description: annonce.description
          });
        });
      }

      if (associations) {
        associations.forEach(association => {
          items.push({
            id: `association-${association.id}`,
            type: 'association',
            name: association.name,
            commune: communeMap.get(association.commune_id) || 'Non spécifié',
            latitude: association.latitude,
            longitude: association.longitude,
            photo: association.logo_url,
            description: association.description
          });
        });
      }

      if (ads) {
        ads.forEach(ad => {
          items.push({
            id: `ad-${ad.id}`,
            type: 'ad',
            name: ad.title,
            commune: communeMap.get(ad.commune_id) || 'Non spécifié',
            latitude: ad.latitude,
            longitude: ad.longitude,
            photo: ad.image_url,
            description: ad.description
          });
        });
      }

      setMapItems(items);
    } catch (error) {
      console.error('Error loading map items:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  const filteredItems = mapItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'events') return item.type === 'event';
    if (filter === 'commerces') return item.type === 'commerce';
    if (filter === 'annonces') return item.type === 'annonce';
    if (filter === 'associations') return item.type === 'association';
    return true;
  });

  const getMarkerIcon = (type: string) => {
    const iconColors: Record<string, string> = {
      event: '#3b82f6',
      commerce: '#10b981',
      annonce: '#f59e0b',
      association: '#8b5cf6',
      ad: '#ef4444'
    };

    const color = iconColors[type] || '#6b7280';

    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      event: 'Événement',
      commerce: 'Commerce',
      annonce: 'Annonce',
      association: 'Association',
      ad: 'Publicité'
    };
    return labels[type] || type;
  };

  if (!mapCenter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Map className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="h-[calc(100vh-5rem)]">
        <div className="h-full flex flex-col">
          <div className="bg-white shadow-lg p-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <Map className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-800">Carte Interactive</h1>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    filter === 'all'
                      ? 'bg-gradient-to-r from-blue-900 to-cyan-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Tout ({mapItems.length})
                </button>
                <button
                  onClick={() => setFilter('events')}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    filter === 'events'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Événements ({mapItems.filter(i => i.type === 'event').length})
                </button>
                <button
                  onClick={() => setFilter('commerces')}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    filter === 'commerces'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Commerces ({mapItems.filter(i => i.type === 'commerce').length})
                </button>
                <button
                  onClick={() => setFilter('annonces')}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    filter === 'annonces'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Annonces ({mapItems.filter(i => i.type === 'annonce').length})
                </button>
                <button
                  onClick={() => setFilter('associations')}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    filter === 'associations'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Associations ({mapItems.filter(i => i.type === 'association').length})
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Map className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-pulse" />
                  <p className="text-gray-600">Chargement des données...</p>
                </div>
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={DEFAULT_ZOOM}
                className="w-full h-full"
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {filteredItems.map((item) => (
                  <Marker
                    key={item.id}
                    position={[item.latitude, item.longitude]}
                    icon={getMarkerIcon(item.type)}
                  >
                    <Popup maxWidth={300}>
                      <div className="p-2">
                        {item.photo && (
                          <img
                            src={item.photo}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mb-2">
                            {getTypeLabel(item.type)}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {item.commune}
                        </p>
                        {userLocation && (
                          <p className="text-sm text-gray-600 mb-2">
                            Distance: {calculateDistance(
                              userLocation[0],
                              userLocation[1],
                              item.latitude,
                              item.longitude
                            )}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <button className="w-full bg-gradient-to-r from-blue-900 to-cyan-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition">
                          Voir détails
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
