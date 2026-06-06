# Stockmaster

Application de gestion de stock, ventes, achats, livraisons, devis et facturation.

## Fonctionnalites principales

- Authentification avec Supabase
- Isolation des donnees par utilisateur avec `RLS`
- Gestion des clients, fournisseurs et produits
- Gestion des achats, ventes, bons de livraison, devis et factures
- Journal de caisse, inventaire, alertes et operations bancaires
- Interface multilingue avec prise en charge du francais et de l'arabe

## Stack technique

- React
- TypeScript
- Vite
- Zustand
- React Router
- TanStack Query
- Supabase
- Tailwind CSS
- shadcn/ui

## Lancement en local

```bash
npm install
npm run dev
```

## Variables d'environnement

Configurez les variables suivantes avant de lancer l'application ou de la deployer:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Un exemple est disponible dans [.env.example](file:///c:/Users/SFT/Desktop/project/drivertruck/stockmaster/stockmaster-maroc-main/.env.example).

## Build production

```bash
npm run build
```

## Deploiement

Le projet peut etre deploye sur Vercel en utilisant:

- `Build Command`: `npm run build`
- `Output Directory`: `dist`
- `Root Directory`: racine du depot

## Base de donnees

Le schema SQL principal est disponible dans [app_state.sql](file:///c:/Users/SFT/Desktop/project/drivertruck/stockmaster/stockmaster-maroc-main/supabase/app_state.sql).
