# CLAUDE.md

> Contexte permanent du projet. Claude Code lit ce fichier automatiquement à chaque session.
> À placer à la **racine du projet**, nommé exactement `CLAUDE.md`.

## Le projet

Plateforme web **SaaS multi-écoles** pour le Sénégal, inspirée de Pronote. Chaque collège/lycée l'utilise pour gérer sa vie scolaire (emploi du temps, notes, devoirs, absences, communication) et paie un abonnement.

## Qui je suis

Je débute totalement en programmation. C'est toi qui écris le code ; moi je décris et je teste.
- Explique simplement, sans jargon inutile.
- **Une étape à la fois**, et attends ma validation avant de continuer.
- Après chaque étape, dis-moi précisément quoi faire de mon côté (commandes à lancer, où cliquer pour tester).
- Si un choix technique important se présente, donne-moi les options simplement et recommande-en une.

## Stack technique

- **Next.js** (TypeScript) — front + logique serveur, un seul projet, **mobile-first** et léger.
- **Supabase** — PostgreSQL, authentification, stockage de fichiers, Row Level Security.
- **Hébergement** : Vercel + Supabase.
- **Git** dès le départ, secrets dans `.env` (jamais dans le code).

## RÈGLE CRITIQUE — isolation multi-école

- Une table `ecoles`. **Toute autre table** a une colonne `ecole_id`.
- La **Row Level Security de Supabase** doit empêcher qu'une école voie ou modifie les données d'une autre. L'isolation est garantie au niveau de la base de données, pas seulement dans le code.
- Vérifie cette isolation à chaque nouvelle fonctionnalité. C'est le point le plus important du projet.

## Les 5 rôles

- **Super-admin** (moi) : voit toutes les écoles, gère les abonnements, suspend une école.
- **Admin école** : configure son école (classes, matières, profs, élèves, emplois du temps).
- **Professeur** : notes, appréciations, devoirs, appel, communication.
- **Élève** : son emploi du temps, ses notes, ses devoirs, ses messages.
- **Parent** : infos de son enfant, justification des absences, communication.

## Contraintes Sénégal

- Interface **mobile-first**, légère, utilisable avec peu de réseau.
- Interface en **français** (wolof possible plus tard).
- Données d'élèves mineurs : conception soucieuse de la **protection des données**.
- Paiement plus tard via mobile money (Orange Money, Wave, Free Money), probablement via CinetPay ou PayDunya.

## Ordre de construction

1. **Socle** : projet + Supabase + connexion 5 rôles + isolation multi-école.
2. Une fonction complète de bout en bout : les **notes** (valide l'architecture).
3. Emploi du temps + devoirs.
4. Bulletins (PDF) + absences + messagerie + statistiques.
5. Onboarding d'une école.
6. Abonnements + paiement.

Ne jamais construire plusieurs grosses fonctions en même temps.

## Commandes utiles

```
npm run dev        # lancer le site en local (http://localhost:3000)
npx tsc --noEmit   # vérifier qu'il n'y a pas d'erreur TypeScript
```

- **Windows** : si une commande npm réseau échoue (certificats antivirus), préfixer avec
  `NODE_OPTIONS=--use-system-ca`.
- **Migrations SQL** : les fichiers `supabase/migrations/000X_*.sql` se lancent à la main dans
  le SQL Editor de Supabase (copier-coller + Run), pas via la CLI.

## Commercial — rentrée 2026

- Objectif et plan : mémoire Claude `objectif-commercial-rentree-2026`.
- **Déclaration CDP à faire avant la rentrée d'octobre** (décidé 11/07) : la loi n° 2008-12
  impose de déclarer le traitement de données personnelles à la CDP (cdp.sn) avant mise en
  œuvre. Mentionner l'hébergement hors Sénégal (Supabase/Vercel). Une fois le récépissé
  obtenu → argument de vente (slide « Protection des données »).
- **Liste des écoles cibles** : `docs/ecoles-cibles.md` (top 10 Kaolack + réserve, suivi de
  statut ⚪→🟡→🟢→✅ à tenir à jour après chaque contact).
- Supports de vente : prompts dans `docs/prompts-claude-design.md` (n°9 = flyer A5 de prospection).
- **Kit école pilote (directeur ami)** : `docs/pilote-directeur-ami.md` (message WhatsApp, déroulé
  du RDV démo, checklist d'onboarding + journal à tenir à jour).
- Vidéo promo officielle : `promo-video/Jàng-Video-Promo.mp4`.

## Avancement

> Le détail à jour (étape en cours + point de reprise) vit dans la mémoire Claude
> (`avancement-projet-jang`), pas ici, pour éviter les doublons.
