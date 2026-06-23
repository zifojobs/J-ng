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

> (À compléter une fois le projet initialisé — ex. lancer le serveur, les tests.)

```
# npm run dev   → lancer le site en local
```
