# GardFlow - Application Locale du Gard Rhodanien

Application web progressive pour le réseau social local du Gard Rhodanien.

## Déploiement

### Netlify (Recommandé)

1. Allez sur [netlify.com](https://www.netlify.com)
2. Créez un compte gratuit
3. Cliquez sur "Add new site" > "Import an existing project"
4. Connectez votre dépôt Git ou glissez-déposez le dossier du projet
5. Dans les paramètres de build :
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Ajoutez vos variables d'environnement dans "Site settings" > "Environment variables" :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Déployez

### Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Créez un compte gratuit
3. Importez votre projet
4. Ajoutez les variables d'environnement
5. Déployez

### GitHub Pages

1. Installez gh-pages : `npm install -D gh-pages`
2. Ajoutez dans package.json :
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Configurez `base: '/nom-du-repo/'` dans vite.config.ts
4. Exécutez : `npm run deploy`

## Variables d'environnement

Créez un fichier `.env` avec :

```
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon
```

## Développement local

```bash
npm install
npm run dev
```

## Build de production

```bash
npm run build
```
