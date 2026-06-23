# Prompt complet à coller dans Claude Code

> Copie tout le texte ci-dessous (à partir de « Tu es… ») et colle-le dans Claude Code.

---

Tu es mon assistant de développement principal sur ce projet. Je débute totalement en programmation : c'est toi qui écris le code, et moi je décris ce que je veux et je teste. Explique-moi chaque chose simplement, sans jargon inutile, et **ne code qu'une étape à la fois en attendant ma validation avant de continuer**.

## Le projet

Je veux construire une **plateforme web SaaS multi-écoles** pour le Sénégal, inspirée de Pronote (logiciel scolaire français). Chaque établissement (collège/lycée) l'utilise pour gérer sa vie scolaire en ligne, et paie un abonnement. Je construis d'abord, je démarche les écoles ensuite.

## Stack technique imposé

- **Next.js** (TypeScript) pour le front et la logique serveur, dans un seul projet, pensé **mobile-first** et léger (connexions limitées au Sénégal).
- **Supabase** pour : base de données PostgreSQL, authentification, stockage de fichiers, et **Row Level Security (RLS)**.
- **Hébergement** prévu sur Vercel + Supabase.
- Mets en place dès le départ les bonnes pratiques : un dépôt **Git**, des variables d'environnement (`.env`) pour les secrets, et une structure de dossiers claire.

## Architecture multi-tenant (POINT LE PLUS CRITIQUE)

- Une table `ecoles`. **Chaque autre table** (utilisateurs, classes, matières, notes, devoirs, absences, messages…) doit contenir une colonne `ecole_id`.
- Active la **Row Level Security de Supabase** pour qu'une école ne puisse JAMAIS voir ni modifier les données d'une autre école. L'isolation doit être garantie au niveau de la base de données, pas seulement dans le code.
- Vérifie cette isolation à chaque fonctionnalité qu'on ajoute.

## Les 5 rôles utilisateurs

1. **Super-admin** (moi) : voit toutes les écoles, gère les abonnements, peut suspendre une école.
2. **Admin école** (direction) : configure son école (classes, matières, profs, élèves, emplois du temps).
3. **Professeur** : saisit notes, appréciations, devoirs, fait l'appel, communique.
4. **Élève** : voit son emploi du temps, ses notes, ses devoirs, ses messages.
5. **Parent** : voit les infos de son enfant, justifie les absences, communique.

## Fonctionnalités, par phases

**Phase 1 — MVP (à construire en premier) :**
- Connexion sécurisée avec les 5 rôles.
- Gestion école : créer classes, matières, inscrire élèves et profs.
- Emploi du temps des élèves, visible par les utilisateurs concernés.
- Saisie des notes (note, matière, coefficient, date).
- Travail à faire / devoirs : saisi par le prof, visible des élèves et parents.

**Phase 2 :**
- Appréciations de bulletin par matière + bulletin imprimable en PDF.
- Absences et retards : saisis par le prof, justifiés par le parent.
- Messagerie interne entre familles, élèves et équipe pédagogique.
- Statistiques : nombre d'absences, moyennes par classe et par matière.

**Phase 3 — monétisation :**
- Onboarding : une école crée son compte et se configure seule.
- Abonnements et paiement (mobile money sénégalais : Orange Money, Wave, Free Money — probablement via un agrégateur type CinetPay ou PayDunya ; on verra les détails à cette étape).

## Contraintes Sénégal

- Interface **mobile-first**, légère, fonctionnelle même avec peu de réseau.
- Prévoir plus tard des **notifications SMS** en complément.
- Données d'élèves mineurs : conception soucieuse de la **protection des données** dès le départ.
- Français d'abord ; possibilité d'ajouter le wolof plus tard.

## Comment je veux qu'on travaille

1. **Commence par me proposer un plan global** : structure du projet et schéma de base de données complet (toutes les tables avec leur `ecole_id`), pour que je valide l'architecture avant tout code.
2. Ensuite, construis **uniquement la Phase 1**, et **dans la Phase 1, une fonctionnalité à la fois** : tu codes, tu m'expliques comment tester, j'valide, on passe à la suivante.
3. Après chaque étape, dis-moi précisément **quoi faire de mon côté** (commandes à lancer, où cliquer pour tester).
4. Si un choix important se présente (ex. une option technique), explique-moi les options simplement et recommande-en une.

**Première action : ne code encore rien. Propose-moi d'abord le plan global du projet + le schéma complet de la base de données. On valide ensemble, puis on attaque la connexion et l'isolation multi-école.**
