import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Upload } from 'lucide-react';

interface Commune {
  id: string;
  name: string;
  code_postal: string;
}

export default function ProfessionnelRegistration() {
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [siret, setSiret] = useState('');
  const [activite, setActivite] = useState('');
  const [adresse, setAdresse] = useState('');
  const [communeId, setCommuneId] = useState('');
  const [autreCommune, setAutreCommune] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [siteInternet, setSiteInternet] = useState('');
  const [password, setPassword] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (userId: string): Promise<string | null> => {
    if (!logoFile) return null;

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${userId}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(fileName, logoFile, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const validateSiret = (value: string): boolean => {
    const cleaned = value.replace(/\s/g, '');
    return cleaned.length === 14 && /^\d+$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!validateSiret(siret)) {
        throw new Error('Le numéro SIRET doit contenir 14 chiffres');
      }

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
        let logoUrl = null;
        if (logoFile) {
          logoUrl = await uploadLogo(data.user.id);
        }

        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: email,
              username: nomEntreprise.toLowerCase().replace(/\s+/g, '_'),
              full_name: nomEntreprise,
              telephone: telephone,
              commune_id: communeId === 'autre' ? null : communeId,
              autre_commune: communeId === 'autre' ? autreCommune : null,
              siret: siret.replace(/\s/g, ''),
              activite: activite,
              adresse: adresse,
              site_internet: siteInternet,
              logo_url: logoUrl,
              account_type: 'professionnel',
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
      <h2 className="text-xl font-bold text-gray-900 mb-4">Inscription Professionnel</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom de l'entreprise <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={nomEntreprise}
          onChange={(e) => setNomEntreprise(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="Nom de votre entreprise"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numéro SIRET <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={siret}
          onChange={(e) => setSiret(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="123 456 789 00010"
          pattern="[0-9\s]{14,17}"
          required
        />
        <p className="text-xs text-gray-500 mt-1">14 chiffres (espaces autorisés)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Activité <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={activite}
          onChange={(e) => setActivite(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="Restaurant, Commerce, Association..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="12 rue de la République"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Commune <span className="text-red-500">*</span>
        </label>
        <select
          value={communeId}
          onChange={(e) => setCommuneId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          required
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
          Téléphone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="04 12 34 56 78"
          required
        />
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
          placeholder="contact@entreprise.fr"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Site internet
        </label>
        <input
          type="url"
          value={siteInternet}
          onChange={(e) => setSiteInternet(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="https://www.votre-site.fr"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Logo de l'entreprise
        </label>
        <div className="flex items-center gap-4">
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Preview"
              className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
            />
          )}
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-cyan-500 transition">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {logoFile ? logoFile.name : 'Choisir un logo'}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
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
        <Building2 className="w-5 h-5" />
        {loading ? 'Création du compte...' : 'Créer mon compte professionnel'}
      </button>
    </form>
  );
}
