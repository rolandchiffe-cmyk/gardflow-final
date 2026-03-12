import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Upload, MapPin } from 'lucide-react';

interface Commune {
  id: string;
  name: string;
  code_postal: string;
}

export default function ParticulierRegistration() {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [communeId, setCommuneId] = useState('');
  const [autreCommune, setAutreCommune] = useState('');
  const [password, setPassword] = useState('');
  const [geolocalisation, setGeolocalisation] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCommunes();
  }, []);

  const loadCommunes = async () => {
    const { data } = await supabase
      .from('communes')
      .select('*')
      .order('name');

    if (data) {
      setCommunes(data);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (userId: string): Promise<string | null> => {
    if (!photoFile) return null;

    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${userId}/profile.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(fileName, photoFile, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (communeId === 'autre' && !autreCommune.trim()) {
        throw new Error('Veuillez indiquer votre commune');
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        if (
          error.message?.toLowerCase().includes('already registered') ||
          error.message?.toLowerCase().includes('already been registered') ||
          error.message?.toLowerCase().includes('user already registered')
        ) {
          throw new Error('Un compte existe déjà avec cet email. Veuillez vous connecter ou utiliser une autre adresse email.');
        }
        throw error;
      }

      if (!data.user) {
        throw new Error('Erreur lors de la création du compte. Veuillez réessayer.');
      }

      if (!data.session) {
        throw new Error('Un compte existe déjà avec cet email. Veuillez vous connecter ou utiliser une autre adresse email.');
      }

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (existing) {
        throw new Error('Un compte existe déjà avec cet email. Veuillez vous connecter ou utiliser une autre adresse email.');
      }

      if (data.user) {
        let photoUrl = null;
        if (photoFile) {
          photoUrl = await uploadPhoto(data.user.id);
        }

        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: email,
              prenom: prenom,
              nom: nom,
              username: `${prenom.toLowerCase()}.${nom.toLowerCase()}`,
              full_name: `${prenom} ${nom}`,
              telephone: telephone,
              commune_id: communeId === 'autre' ? null : communeId,
              autre_commune: communeId === 'autre' ? autreCommune : null,
              geolocalisation_autorisee: geolocalisation,
              photo_profil_url: photoUrl,
              account_type: 'particulier',
            },
          ]);
        if (profileError) throw profileError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Inscription Particulier</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Jean"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Dupont"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="email@exemple.fr"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Téléphone <span className="text-gray-400 text-xs font-normal">(optionnel)</span>
        </label>
        <input
          type="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="06 12 34 56 78"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Commune
        </label>
        <select
          value={communeId}
          onChange={(e) => setCommuneId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        >
          <option value="">Sélectionnez votre commune</option>
          {communes.map((commune) => (
            <option key={commune.id} value={commune.id}>
              {commune.name} ({commune.code_postal})
            </option>
          ))}
          <option value="autre">Autre commune</option>
        </select>
      </div>

      {communeId === 'autre' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Précisez votre commune <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={autreCommune}
            onChange={(e) => setAutreCommune(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Nom de votre commune"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Photo de profil
        </label>
        <div className="flex items-center gap-4">
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover"
            />
          )}
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-cyan-500 transition">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {photoFile ? photoFile.name : 'Choisir une photo'}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mot de passe <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="••••••••"
          minLength={6}
          required
        />
        <p className="text-xs text-gray-500 mt-1">Au moins 6 caractères</p>
      </div>

      <div className="flex items-center gap-2 p-4 bg-cyan-50 rounded-lg">
        <input
          type="checkbox"
          id="geolocalisation"
          checked={geolocalisation}
          onChange={(e) => setGeolocalisation(e.target.checked)}
          className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
        />
        <label htmlFor="geolocalisation" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <MapPin className="w-4 h-4 text-cyan-600" />
          Autoriser la géolocalisation
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-500 text-white py-3 rounded-lg font-medium hover:bg-cyan-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <UserPlus className="w-5 h-5" />
        {loading ? 'Création du compte...' : 'Créer mon compte'}
      </button>
    </form>
  );
}
