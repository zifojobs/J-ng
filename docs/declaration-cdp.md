# Déclaration à la CDP — dossier de préparation (Jàng)

> **But de ce document.** Rassembler, prêt à recopier, tout ce que demande la
> Commission de Protection des Données Personnelles du Sénégal (CDP, cdp.sn) pour
> déclarer le traitement de données réalisé par la plateforme **Jàng**.
> Claude rédige ; **Saïbo complète les champs « À COMPLÉTER » puis dépose**.
>
> Objectif calendaire : **récépissé obtenu avant la rentrée d'octobre 2026.**
> Le récépissé devient ensuite un **argument de vente** (slide « Protection des données »).
>
> ⚠️ Ce document est une **préparation sérieuse, pas un avis juridique**. Avant dépôt,
> valider les 2-3 points marqués 🟠 (notamment le régime applicable aux données de santé).

---

## 0. Décisions (prises le 2026-07-13, sauf D2 à relever)

| # | Question | Décision |
|---|----------|----------|
| **D1** | Sous quelle identité déclarer ? | ✅ **Personne physique — Saïbo Danfakha**, freelance, adresse Kaolack. À mettre à jour si une structure est immatriculée plus tard. |
| **D2** | Où sont physiquement hébergées les données ? | ✅ **Supabase → AWS `eu-west-1`, Irlande (UE)** (vérifié le 13/07). Vercel = diffusion mondiale, pas de stockage persistant. Transfert hors Sénégal à déclarer (§ 7). |
| **D3** | Le motif d'absence (champ libre) peut contenir une donnée de santé. | ✅ **Fermer le champ** : motif = liste (*familial / médical / autre*), sans détail. Jàng reste dans le régime simple de déclaration. **Petit changement de code à faire** (cf. § 11). |

---

## 1. Base légale et régime de déclaration

- **Loi n° 2008-12 du 25 janvier 2008** sur la protection des données à caractère personnel.
- **Article 18** : tout traitement de données personnelles doit être **déclaré à la CDP avant sa mise en œuvre**.
- **Régime applicable à Jàng : déclaration préalable** (régime ordinaire).
- **Données sensibles (santé) : neutralisées.** Le traitement des données de **santé** relèverait
  d'une **autorisation préalable** (régime renforcé). Jàng ne collecte aucune donnée de santé
  structurée ; le seul point de contact était le *motif* de justification d'absence (texte libre).
  **Décision D3 : ce champ passe en liste fermée** (familial / médical / autre) → Jàng **reste
  entièrement dans le régime de la déclaration**.

---

## 2. Le déclarant (responsable de traitement)

| Champ | Valeur |
|-------|--------|
| Nom / raison sociale | **Saïbo Danfakha** |
| Statut | **Personne physique** — développeur web freelance |
| Adresse | Parcelles Assainies Unité 2, Lot 158, Kaolack, Sénégal |
| Téléphone | +221 77 527 71 64 |
| E-mail de contact | youmou@saibodanfakha.com |
| Rôle | Éditeur et exploitant de la plateforme SaaS **Jàng** |

> **Note « responsable / sous-traitant ».** Dans un SaaS, chaque **école** est en principe
> *responsable* des données de ses élèves, et l'éditeur (Jàng) *sous-traitant* technique.
> En pratique, tant que tu héberges et détermines les moyens (Supabase/Vercel), **tu dois
> figurer à la déclaration**. Le plus simple et le plus honnête pour démarrer : déclarer le
> traitement en ton nom en tant qu'exploitant. À affiner avec la CDP si elle demande une
> distinction formelle.

---

## 3. Finalité du traitement

**Gestion de la vie scolaire en ligne pour des établissements privés** (collèges/lycées) au
Sénégal, via une plateforme SaaS multi-écoles. Concrètement :

- inscription et gestion des élèves, professeurs et personnels par chaque école ;
- saisie et consultation des **notes**, appréciations et **bulletins** ;
- **emploi du temps** et **devoirs** ;
- **absences et retards** (appel, justification par les parents) ;
- **messagerie interne** entre l'école, les élèves et les familles ;
- statistiques pédagogiques (moyennes par classe/matière) ;
- gestion des **abonnements** des écoles à la plateforme.

Le traitement **ne poursuit aucune finalité publicitaire** et **ne revend aucune donnée**.

---

## 4. Catégories de personnes concernées

- **Élèves** (en majorité **mineurs**) ;
- **Parents / responsables légaux** ;
- **Professeurs** et personnels pédagogiques ;
- **Administrateurs d'école** (direction) ;
- **Directeurs prospects** ayant rempli le formulaire public de demande d'inscription.

---

## 5. Catégories de données collectées

*(Reflète fidèlement le schéma réel de la base — tables Supabase.)*

| Donnée | Personnes | Table (réf. technique) |
|--------|-----------|------------------------|
| Nom, prénom | Tous | `profils` |
| Identifiant / matricule (login sans e-mail) | Élèves, parents | `profils.identifiant` |
| E-mail | Profs, admins (élèves/parents : facultatif) | `profils.email` |
| Téléphone | Optionnel | `profils.telephone` |
| Photo de profil | Optionnel | `profils.photo_url` (stockage Supabase) |
| Rôle et rattachement à une école | Tous | `profils.role`, `profils.ecole_id` |
| Classe de l'élève | Élèves | `profils.classe_id` |
| Lien de filiation parent ↔ enfant | Parents/élèves | `parents_eleves` |
| **Notes**, appréciations | Élèves | `notes`, `appreciations` |
| **Absences / retards** + motif (liste fermée, cf. D3) | Élèves | `absences` |
| Devoirs, emploi du temps | Élèves | `devoirs`, `emploi_du_temps` |
| **Messages internes** (contenu libre) | Tous | `messages` |
| Coordonnées de l'école | Écoles | `ecoles` (adresse, tél., logo, directeur) |
| Demande d'inscription (nom, prénom, e-mail, tél., ville, message) | Directeurs prospects | `demandes_inscription` |
| Identifiants de connexion (e-mail + **mot de passe haché**) | Tous | Supabase Auth (`auth.users`) |

**Aucune donnée bancaire n'est stockée par Jàng** : le paiement (mobile money) passera par un
agrégateur agréé (CinetPay/PayDunya) — à déclarer le moment venu, pas encore actif.

**Données sensibles (au sens de la loi) : aucune collectée volontairement.** Seul risque
résiduel = un motif d'absence à connotation médicale → neutralisé par la décision **D3**.

---

## 6. Destinataires des données

Les données ne sont accessibles qu'**à l'intérieur de l'école concernée**, selon le rôle :

- **Admin école** : toutes les données de **sa** école uniquement ;
- **Professeur** : les élèves/notes/absences de **ses** classes ;
- **Élève** : **ses** propres données ;
- **Parent** : les données de **ses** enfants uniquement ;
- **Super-admin (exploitant)** : accès technique transversal pour maintenance et gestion des abonnements.

**Aucune école ne peut voir les données d'une autre** (isolation multi-tenant — cf. § 9).
**Aucun destinataire externe**, aucune cession, aucune revente à des tiers.

---

## 7. Hébergement et transfert hors du Sénégal (à déclarer honnêtement)

- **Base de données, authentification, fichiers** : **Supabase** (PostgreSQL managé), hébergé sur
  **AWS région `eu-west-1` — Irlande (Union européenne)**. *(Vérifié le 13/07 : l'hôte
  `db.<projet>.supabase.co` résout dans le bloc IPv6 AWS `2a05:d018::/35` = eu-west-1.)*
- **Application web** : **Vercel** — réseau mondial de diffusion (edge/CDN), société américaine ;
  la donnée persistante n'y est pas stockée, elle vit dans Supabase (Irlande).
- **Localisation des données : Union européenne (Irlande).** Ces serveurs étant **hors Sénégal**,
  il y a **transfert de données hors du territoire national**, à **mentionner explicitement** dans
  la déclaration. Point favorable : l'UE offre un niveau de protection reconnu (RGPD), argument à
  faire valoir auprès de la CDP.
- **Garanties invoquées** : hébergeurs de niveau international offrant chiffrement au repos et
  en transit, engagements contractuels de sécurité et de confidentialité (DPA fournisseur).
- Piste d'amélioration future (argument commercial) : étudier une région d'hébergement plus
  proche ou un hébergeur conforme, si la CDP le demande.

---

## 8. Durée de conservation

| Donnée | Durée retenue | Statut |
|--------|---------------|--------|
| Données de scolarité (notes, absences, bulletins) | Durée de la scolarité de l'élève dans l'école, **+ 1 an** après son départ | ✅ validé 13/07 |
| Compte utilisateur | Tant que l'école est cliente ; supprimé à la résiliation | ✅ validé 13/07 |
| Messages internes | **1 an** glissant (les plus anciens sont purgés) | ✅ validé 13/07 |
| Demandes d'inscription (prospects) | **1 an** après le dernier contact | ✅ validé 13/07 |
| Données d'une école résiliée | Suppression ou anonymisation **sous 3 mois** après la résiliation (délai laissé à l'école pour récupérer/exporter ses données) | ✅ validé 13/07 |

*Fondement : la loi 2008-12 impose une conservation « n'excédant pas la durée nécessaire aux
finalités ». Ces durées, validées le 13/07/2026, respectent ce principe. Elles pourront être
ajustées si une obligation légale sénégalaise (archivage scolaire officiel) impose plus long —
à vérifier avant la première vente.*

---

## 9. Mesures de sécurité (techniques et organisationnelles)

*(Ce sont les mesures réellement en place dans le code — pas des promesses.)*

**Techniques :**
- **Isolation stricte par école (multi-tenant)** : chaque table porte une colonne `ecole_id` et
  la **Row Level Security (RLS) de PostgreSQL** interdit, **au niveau de la base**, qu'une école
  accède aux données d'une autre. L'isolation est vérifiée à chaque nouvelle fonctionnalité.
- **Contrôle d'accès par rôle** : des politiques RLS distinctes pour super-admin, admin, prof,
  élève, parent — un parent ne voit que ses enfants, un prof que ses classes, etc.
- **Authentification** gérée par Supabase Auth ; **mots de passe stockés hachés** (jamais en clair).
- **Connexion élèves/parents par matricule** (pas besoin d'e-mail personnel de mineur).
- **Chiffrement en transit** (HTTPS/TLS sur Vercel et Supabase) et **au repos** (base managée).
- Secrets applicatifs hors du code (variables d'environnement), non versionnés.
- Sauvegardes automatiques assurées par l'hébergeur managé.

**Organisationnelles :**
- Accès super-admin réservé à l'exploitant ; **mot de passe fort, non partagé** (🟠 *action en cours :
  renforcer le mot de passe super-admin et le retirer de toute note en clair — à solder avant dépôt*).
- Principe de minimisation : on ne demande pas de donnée non nécessaire (matricule plutôt qu'état civil complet).
- Journalisation des accès disponible côté Supabase.

---

## 10. Droits des personnes concernées

Conformément à la loi 2008-12, toute personne (ou le parent pour un mineur) peut exercer ses
droits d'**accès, de rectification, d'opposition et de suppression**.

- **Modalité d'exercice** : demande auprès de **son école** (premier interlocuteur) ou par e-mail
  à **youmou@saibodanfakha.com**.
- **Délai de réponse** : dans un délai raisonnable (proposition : 30 jours).
- Une mention d'information (qui traite quoi, pourquoi, quels droits) sera ajoutée sur la
  plateforme et/ou dans les documents remis aux familles. → **à rédiger** (petite page « Vie privée »).

---

## 11. Ce qu'il reste à faire (checklist avant dépôt)

- [x] **D1** — identité du déclarant : personne physique Saïbo Danfakha (§ 2). ✅
- [x] **D2** — hébergement identifié : Supabase / AWS eu-west-1 Irlande (§ 7). ✅
- [x] **D3** — champ motif d'absence fermé (liste `Familial / Médical / Autre`). ✅ **Codé le 13/07** :
      `<select>` dans `ListeAbsences.tsx`, validation dans `absences/actions.ts`, migration SQL
      `supabase/migrations/0025_motif_absence_liste.sql` (⚠️ **à lancer dans le SQL Editor Supabase**).
- [ ] Compléter le **téléphone** et l'adresse précise du déclarant (§ 2).
- [x] **Durées de conservation** validées le 13/07 (§ 8). ✅
- [ ] Solder l'action **mot de passe super-admin** (§ 9).
- [ ] Rédiger la petite **page « Vie privée »** sur la plateforme (§ 10).
- [ ] **Déposer** (procédure = télécharger le formulaire, le remplir avec les sections ci-dessus,
      l'envoyer par e-mail ou courrier) :
  - Formulaires : **https://www.cdp.sn/liste-des-formulaires** (prendre le formulaire de *déclaration*)
  - Formalités / procédure : **https://www.cdp.sn/conformite/formalites**
  - Envoi : **contactcdp@cdp.sn** — ou courrier : CDP, 34 Sicap Mermoz VDN, Lot B, Dakar — tél. +221 33 852 64 84
  - Joindre une **pièce d'identité** du déclarant (personne physique).
- [ ] **Conserver le récépissé** → créer la slide « Protection des données » pour la vente.

---

*Dernière mise à jour : 2026-07-13. Rédigé à partir du schéma réel `supabase/migrations/`.*
