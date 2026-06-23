# Cahier des charges — Plateforme scolaire (type Pronote) pour le Sénégal

> Document de cadrage à fournir à Claude Code pour construire le projet, étape par étape.
> Donne-lui un nom : ex. **ÉcoleConnect**, **Ndémbé**, **Jàng** (« apprendre » en wolof), etc.

---

## 1. Vision en une phrase

Une plateforme web **SaaS multi-écoles** qui permet à chaque établissement (collège/lycée) de gérer la vie scolaire en ligne : emploi du temps, notes, devoirs, absences et communication entre l'école, les élèves et les familles. Chaque école paie un abonnement.

---

## 2. Les utilisateurs et leurs rôles

| Rôle | Ce qu'il peut faire |
|------|---------------------|
| **Super-admin** (toi) | Voir toutes les écoles, gérer les abonnements, suspendre un compte impayé |
| **Admin école** (direction) | Configurer l'école : classes, matières, profs, élèves, emplois du temps |
| **Professeur** | Saisir notes, appréciations, devoirs, faire l'appel, communiquer |
| **Élève** | Voir son emploi du temps, ses notes, ses devoirs, ses messages |
| **Parent/Famille** | Voir les infos de son enfant, justifier les absences, communiquer |

**Règle d'or de sécurité :** les données d'une école ne doivent **jamais** être visibles par une autre. C'est le point le plus critique de tout le projet (« multi-tenant »).

---

## 3. Fonctionnalités

### MVP (à construire en premier — le strict nécessaire pour être utilisable)
1. **Connexion sécurisée** avec les 5 rôles ci-dessus
2. **Gestion école** : créer classes, matières, inscrire élèves et profs
3. **Emploi du temps** des élèves, visible par tous les utilisateurs concernés
4. **Saisie des notes** (la base : note, matière, coefficient, date)
5. **Travail à faire / devoirs** : le prof saisit, visible par élèves et parents

### Version 2 (après que le MVP marche)
6. **Appréciations de bulletin** par matière + bulletin imprimable (PDF)
7. **Absences et retards** : saisie par le prof, justification par le parent
8. **Messagerie interne** entre familles, élèves et équipe pédagogique
9. **Statistiques** : nombre d'absences, moyennes par classe/matière, etc.

### Version 3 (monétisation)
10. **Onboarding** : une école crée son compte et se configure seule
11. **Abonnements et paiement** (voir section 5)

---

## 4. Le stack technique (ce qui fait tourner l'appli)

Choisi pour **réduire le nombre de choses à gérer**, parce que tu construis seul avec Claude Code :

- **Next.js** (TypeScript) — fait à la fois les pages (ce que l'utilisateur voit) et la logique serveur, dans un seul projet. Pensé **mobile-first**, chargement rapide (important pour les connexions limitées).
- **Supabase** — fournit d'un coup :
  - la **base de données PostgreSQL**
  - l'**authentification** (connexion/mots de passe) déjà sécurisée
  - le **stockage de fichiers** (le « cloud » pour les documents, photos, bulletins)
  - la **Row Level Security (RLS)** : l'isolation des écoles est garantie au niveau de la base de données, pas seulement par le code → beaucoup plus sûr contre la fuite de données entre écoles.
- **Hébergement** : Vercel (gratuit pour démarrer) + Supabase (offre gratuite au début).

*Pourquoi ce choix et pas un autre :* tout est en un seul langage (TypeScript), tout est très bien documenté, et les parties les plus dangereuses à coder soi-même (auth, isolation des données) sont prises en charge par Supabase.

---

## 5. Spécificités Sénégal (à prévoir, à activer plus tard)

- **Mobile d'abord** : la majorité des parents se connecteront au téléphone. Interface légère.
- **Faible débit** : limiter les images lourdes, prévoir un fonctionnement même avec peu de réseau.
- **Notifications SMS** en plus des notifications dans l'appli (beaucoup consultent peu leurs mails).
- **Paiement mobile money** : Orange Money, Wave, Free Money sont indispensables. Des agrégateurs ouest-africains comme **CinetPay** ou **PayDunya** permettent de tout brancher d'un coup — à explorer au moment de la monétisation (dernière étape).
- **Langue** : français pour commencer, wolof possible plus tard sur certains écrans.
- **Protection des données** : tu stockeras des données d'enfants. Au Sénégal, la **CDP** (Commission de Protection des Données Personnelles) encadre ça. À te renseigner avant de vendre.

---

## 6. Ordre de construction recommandé

1. **Le socle** : projet Next.js + Supabase + connexion avec les rôles + isolation multi-école. *(À blinder avant tout le reste.)*
2. **Une fonction complète de bout en bout** : les **notes**, pour valider que l'architecture tient.
3. Emploi du temps + devoirs.
4. Bulletins, absences, messagerie, statistiques.
5. Onboarding d'une école.
6. Abonnements et paiement.

Ne construis **jamais** plusieurs grosses fonctions en même temps. Une à la fois, testée, qui marche, avant de passer à la suivante.

---

## 7. Premier prompt à donner à Claude Code

> « Je veux créer une plateforme scolaire SaaS multi-écoles avec Next.js (TypeScript) et Supabase. Avant tout code, aide-moi à :
> 1. Initialiser le projet Next.js et le connecter à Supabase.
> 2. Concevoir le schéma de base de données pour le multi-tenant : une table `ecoles`, et chaque autre table (utilisateurs, classes, matières, notes…) doit avoir une colonne `ecole_id`.
> 3. Mettre en place la Row Level Security de Supabase pour qu'une école ne puisse jamais voir les données d'une autre.
> 4. Créer l'authentification avec 5 rôles : super-admin, admin-école, professeur, élève, parent.
>
> Explique-moi chaque étape simplement, je débute. Ne code qu'une étape à la fois et attends ma validation avant de passer à la suivante. »

---

*Conseil : garde ce document ouvert. À chaque nouvelle session avec Claude Code, recolle la section concernée pour qu'il garde le contexte.*
