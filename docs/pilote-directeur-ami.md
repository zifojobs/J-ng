# Kit pilote — Directeur ami

> Créé le 04/07/2026. Objectif : verrouiller l'école pilote AVANT mi-juillet.
> C'est le maillon n°1 du plan commercial : son témoignage sert de preuve sociale
> pour tout le démarchage d'août (voir `ecoles-cibles.md`).

## 1. L'offre en une phrase

**« Je t'installe Jàng gratuitement pour toute l'année scolaire 2026-2027, je forme
tes profs moi-même, et en échange tu me donnes ton retour honnête + un témoignage
que je peux montrer aux autres directeurs. »**

Détails de l'offre :
- **Gratuit pour l'école ET les parents** pendant l'année pilote (ou tarif symbolique
  si tu préfères qu'il « paie un peu » pour s'engager — à toi de choisir avant l'appel).
- Installation complète faite par toi : classes, matières, profs, élèves — il fournit
  juste les listes.
- Formation admin + profs avec les guides PDF déjà prêts.
- Support direct par WhatsApp avec toi (argument fort : MIRACLE n'offre pas ça).
- En échange : un **témoignage** (2-3 phrases + photo ou court vocal) et le droit de
  citer son école en référence.

## 2. Message WhatsApp prêt à envoyer

> Salut [prénom] ! J'ai une bonne nouvelle pour ton école. Tu sais que je développe
> des plateformes web — j'ai construit **Jàng**, une plateforme de gestion scolaire
> 100% sénégalaise : notes, bulletins PDF avec moyennes devoirs + compo, emploi du
> temps, cahier de textes, appel, messagerie profs-parents. Tout sur téléphone.
>
> Le site est en ligne : **www.jang.sn**
>
> Je lance officiellement à la rentrée d'octobre, et je veux que TON école soit la
> première équipée — **gratuitement toute l'année**, installation et formation des
> profs comprises. En échange, juste ton retour et un témoignage si tu es satisfait.
>
> Je passe te montrer ça en 15 minutes sur mon téléphone. **Mardi ou jeudi, qu'est-ce
> qui t'arrange ?**

⚠️ Règle du plan : toujours finir par une question fermée A/B, jamais « dis-moi quand ».

## 3. Déroulé du RDV (15 minutes)

1. **2 min — le problème** : bulletins à la main, parents qui appellent pour les notes,
   registres d'appel papier, pas de trace.
2. **8 min — démo live sur téléphone** (comptes démo, mdp `demo1234`) :
   - Connexion élève : matricule `COL-6eA-01` + code école `college-cheikh-anta-diop`
   - Montrer dans cet ordre : accueil élève (prochain cours) → notes → **bulletin PDF**
     (le « wow » : mention, rang, moyenne de classe, imprimable) → emploi du temps.
   - Basculer côté prof : saisie de notes + appel en 30 secondes.
   - Côté directeur : tableau de bord (moyennes par classe, absences).
3. **3 min — l'offre** (section 1) + répondre aux questions.
   - Objection « données des élèves » → chaque école est isolée dans la base, données
     hébergées de façon sécurisée, conception pensée pour des mineurs.
   - Objection « mes profs ne sont pas à l'aise » → formation incluse + guides PDF
     simples + ça marche sur n'importe quel téléphone.
4. **2 min — conclure** : « On démarre l'installation cette semaine ? Il me faut juste
   tes listes (point 4). Tu me les envoies en photo sur WhatsApp, même manuscrites. »

## 4. Checklist des infos à collecter pour l'onboarding

Format libre : photos de listes papier, Excel, ou dictées vocales — tout convient.

**L'école :**
- [ ] Nom officiel de l'établissement
- [ ] Adresse + téléphone
- [ ] Nom complet du directeur (apparaît sur les bulletins)
- [ ] Logo (photo/scan, même imparfait) — facultatif
- [ ] Année scolaire : 2026-2027 (dates de début/fin)

**La structure :**
- [ ] Liste des classes (ex. 6eA, 6eB, 5eA…)
- [ ] Liste des matières **avec leurs coefficients** (celle utilisée sur ses bulletins actuels)
- [ ] Liste des profs : prénom, nom, (email si dispo), et qui enseigne quoi dans quelle classe

**Les personnes :**
- [ ] Listes des élèves par classe : prénom + nom (le matricule peut être généré)
- [ ] Parents (facultatif au démarrage — peut venir dans un 2e temps) : nom + enfant(s)

**Ce que je fais ensuite (toi, via Claude) :**
1. Créer l'école depuis `/super-admin` → le directeur reçoit l'email de bienvenue
   automatique (@jang.sn) avec ses identifiants.
2. Saisir année, classes, matières+coef, profs, affectations, élèves (script d'import
   possible si les listes sont longues — on l'écrira à ce moment-là).
3. RDV formation : 1h avec le directeur + les profs, guides PDF distribués.
4. Flyer parents « comment se connecter » distribué à la rentrée.

## 5. Après le contact — tenir à jour

- Mettre à jour la ligne n°1 de `ecoles-cibles.md` : 🔴 → 🟡 RDV pris → 🟢 démo faite → ✅ signé.
- Noter ici la date du RDV, ce qu'il a dit, et la liste de ce qu'il a déjà envoyé.

### Journal
- 04/07/2026 : kit préparé, message prêt à envoyer.
- 11/07/2026 : **répétition générale de la démo faite sur www.jang.sn (mobile) — tout le
  parcours du RDV fonctionne** (élève/bulletin/EDT, prof notes+appel, dashboard directeur).
  Info Saïbo : le directeur prépare le brevet (début 14/07) → **envoyer le message WhatsApp
  vers le 14-15/07**. Conseils démo : se connecter avant le RDV (redirection ~2 s) ; re-tester
  au doigt le bouton « Supprimer » d'une note.
- 16/07/2026 : **message WhatsApp + vidéo promo envoyés** au directeur ami. Pas encore de
  réponse. Prochaine étape : relance si silence après quelques jours, sinon caler le RDV
  (point 3 du déroulé) dès qu'il répond.
