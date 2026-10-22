# 🛒 FreshList

Listes de courses rangées par rayon, partagées en temps réel et utilisables hors-ligne.
Site statique (GitHub Pages) + [Supabase](https://supabase.com) pour les comptes et les données.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure des écrans |
| `styles.css` | Apparence (thèmes clair et sombre) |
| `theme.js` | Applique le thème avant l'affichage |
| `app.js` | Logique : connexion, listes, synchro hors-ligne, partage, scanner |
| `catalog.js` | Catalogue de produits par rayon |
| `sw.js` | Service worker : fonctionnement hors-ligne |
| `manifest.json`, `icons/` | Installation sur l'écran d'accueil |
| `supabase/migrations/` | Évolutions de la base de données |

## Base de données

Les scripts de `supabase/migrations/` s'appliquent dans l'ordre, via l'éditeur SQL de
Supabase (ou `supabase db push`). Les migrations déjà présentes sont appliquées.

## Mettre à jour une bibliothèque

Les scripts chargés depuis jsDelivr sont figés sur une version et protégés par un
hash d'intégrité (`integrity=`). En changeant de version, recalculer le hash :

```sh
curl -s URL_DU_SCRIPT | openssl dgst -sha384 -binary | openssl base64 -A
```

Penser aussi à mettre à jour l'URL dans `sw.js` et à changer `VERSION` pour vider l'ancien cache.
