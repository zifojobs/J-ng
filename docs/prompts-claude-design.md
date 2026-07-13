# Prompts Claude Design — supports Jàng

> Chaque prompt est autonome. **Colle d'abord le BLOC DE MARQUE ci-dessous**, puis le prompt du document voulu.
> Méthode identique à la refonte premium : Claude Design produit la maquette, tu exportes en PDF.

---

## 🎨 BLOC DE MARQUE (à coller en tête de CHAQUE prompt)

```
Tu conçois un support pour « Jàng », une plateforme web scolaire (façon Pronote) pour les écoles du Sénégal.
« Jàng » veut dire « apprendre » en wolof.

Identité visuelle (à respecter strictement) :
- Couleur dominante : navy profond #0f172a (fonds sombres, premium).
- Couleur d'accent : vert #22c55e (boutons, titres clés, points forts).
- Texte sur navy : blanc et gris clair (#e2e8f0, #94a3b8).
- Logo : la lettre « J » blanche dans un carré arrondi vert #22c55e.
- Style : épuré, premium, moderne, généreux en espace, mobile-first dans l'esprit.
- Langue : 100 % français. Public : Sénégal (directeurs, enseignants, familles).
- Ton : clair, rassurant, professionnel mais chaleureux. Pas de jargon technique.
```

---

## 1) Présentation commerciale aux écoles (diaporama 16:9)

```
[COLLER LE BLOC DE MARQUE]

Crée une PRÉSENTATION commerciale (diaporama 16:9, ~11 slides) destinée à convaincre
le DIRECTEUR d'un collège/lycée privé d'adopter Jàng. Fond navy premium, accents verts.

Slides :
1. Couverture : logo J, « Jàng », baseline « La vie scolaire, simplifiée. » + sous-titre
   « La plateforme tout-en-un pensée pour les écoles du Sénégal ».
2. Le problème : gestion papier/dispersée (notes, absences, bulletins à la main), parents
   peu informés, temps perdu pour l'administration et les profs.
3. La solution : Jàng, une seule plateforme pour toute la vie scolaire, accessible sur
   téléphone, conçue pour fonctionner même avec peu de réseau.
4. Fonctionnalités clés (grille d'icônes) : Notes, Bulletins PDF, Emploi du temps, Devoirs,
   Absences (appel), Messagerie école-familles, Tableau de bord de l'école.
5. Bénéfices par rôle (4 colonnes) : Directeur (pilotage en temps réel), Professeur (saisie
   simple, moins de paperasse), Élève (notes/devoirs/EDT sur son téléphone), Parent (suivi de
   son enfant, justifier les absences, communiquer).
6. Pensé pour le Sénégal : mobile-first, léger, faible consommation de données, interface
   française (wolof envisagé).
7. Protection des données : chaque école est totalement isolée (une école ne voit jamais les
   données d'une autre) ; données d'élèves mineurs traitées avec soin.
8. Le modèle « les parents paient » : un petit supplément ~400–500 F CFA / élève / mois ajouté
   aux frais de scolarité (1 à 3 % des frais) — indolore pour le parent, ÉNORME en valeur.
   L'ÉCOLE NE DÉBOURSE RIEN (elle collecte et reverse, marge possible).
9. Mise en route simple : inscription en ligne, accompagnement, première école pilote
   privilégiée contre témoignage.
10. Tarifs (paliers indicatifs côté école) : petite école < 150 élèves = 40 000 F/mois ;
    moyenne 150–400 = 75 000 F ; grande > 400 = 120 000 F. Installation one-shot 50–100 000 F.
11. Appel à l'action : « Faites entrer votre école dans le numérique » + contact + lien
    d'inscription www.jang.sn.

Mets en avant les chiffres clés et les bénéfices. Slides aérées, une idée par slide,
visuels/icônes plutôt que de longs textes.
```

---

## 2) Guide de prise en main — ADMIN ÉCOLE (document A4 portrait)

```
[COLLER LE BLOC DE MARQUE]

Crée un GUIDE DE PRISE EN MAIN au format document A4 portrait (couverture + ~4-5 pages),
destiné à l'ADMINISTRATEUR d'une école qui découvre Jàng. Couverture navy premium ;
pages intérieures lisibles (fond clair possible pour l'impression, titres verts).

Contenu, sous forme d'étapes numérotées avec emplacements pour captures d'écran :
- Couverture : « Guide de l'administrateur · Jàng » + logo.
- Se connecter (email + mot de passe communiqués à l'inscription de l'école).
  NB : il n'existe pas (encore) de « mot de passe oublié » ni de « rester connecté » —
  en cas d'oubli, contacter le support Jàng.
- Configurer son école (les « Premiers pas / checklist ») : 1. Coordonnées de l'école,
  2. Année scolaire, 3. Classes, 4. Matières (et coefficients), 5. Professeurs,
  6. Élèves, et Parents.
- Créer les emplois du temps (à partir des affectations prof-matière-classe).
- Suivre l'école : le Tableau de bord (effectifs, moyennes par classe, absences).
- Imprimer les bulletins de toute une classe.
- La messagerie : échanges INDIVIDUELS (1-à-1) avec les familles et l'équipe.
  (Pas de diffusion ni d'annonce à toute une classe pour l'instant.)
- Encadré « Bon à savoir » : isolation des données ; comptes élèves ET parents par matricule
  (le parent a son PROPRE compte, distinct de celui de l'enfant, rattaché à un ou plusieurs enfants).

Style guide pratique : pas-à-pas, encadrés d'astuce verts, picto par section, espace réservé
pour une capture d'écran à chaque étape.
```

---

## 3) Guide de prise en main — PROFESSEUR (document A4 portrait)

```
[COLLER LE BLOC DE MARQUE]

Crée un GUIDE DE PRISE EN MAIN A4 portrait (couverture + ~3 pages) pour le PROFESSEUR.
Couverture navy ; intérieur clair et aéré, titres verts, étapes numérotées + emplacements
de captures d'écran.

Contenu :
- Couverture : « Guide du professeur · Jàng ».
- Se connecter (email + mot de passe fournis par l'école).
- Saisir des notes : choisir une de mes classes/matières, ajouter une note (devoir ou
  composition), par semestre.
- Écrire les appréciations par élève.
- Donner un devoir (titre, date « pour le », consigne).
- Faire l'appel (absences / retards) pour une séance. (Les parents le voient quand ils
  ouvrent l'app — il n'y a pas de notification/alerte automatique.)
- Consulter mon emploi du temps.
- Communiquer (messagerie 1-à-1) avec mes élèves et l'administration ; je peux aussi
  RÉPONDRE à un parent qui m'écrit. (Pas d'annonce à toute une classe.)
- Encadré « Astuce » : tout se fait depuis le téléphone.
```

---

## 4) Guide de prise en main — ÉLÈVE (document A4 portrait, ton jeune)

```
[COLLER LE BLOC DE MARQUE]

Crée un GUIDE simple et motivant A4 portrait (couverture + ~2 pages) pour l'ÉLÈVE.
Ton jeune et encourageant. Couverture navy avec accents verts, intérieur clair, gros pictos.

Contenu :
- Couverture : « Bienvenue sur Jàng ! · Guide de l'élève ».
- Me connecter avec mon MATRICULE + le CODE DE MON ÉCOLE (pas besoin d'email).
  NB : le « code école » est un identifiant en minuscules avec des tirets (ex. « college-jang »),
  pas un code court — utiliser ce style d'exemple.
- Mon accueil : mon prochain cours, ma moyenne, mes devoirs à rendre, et un petit message
  d'encouragement à chaque connexion.
- Voir mes notes et mon bulletin.
- Voir mes devoirs et mon emploi du temps.
- Voir mes absences.
- Écrire à mes profs et à l'administration (messagerie).
- Encadré « Astuce » : ajoute Jàng à l'écran d'accueil de ton téléphone.
```

---

## 5) Guide de prise en main — PARENT (document A4 portrait, rassurant)

```
[COLLER LE BLOC DE MARQUE]

Crée un GUIDE A4 portrait (couverture + ~2-3 pages) pour le PARENT. Ton rassurant et simple
(certains parents sont peu à l'aise avec le numérique). Couverture navy, intérieur clair,
grosses étapes illustrées.

Contenu :
- Couverture : « Suivez la scolarité de votre enfant · Guide du parent · Jàng ».
- Me connecter avec MON matricule parent + le CODE DE L'ÉCOLE (les deux remis par l'école).
  IMPORTANT : le parent a son PROPRE compte, distinct de celui de l'enfant — ce n'est PAS
  le matricule de l'enfant. Le « code école » est en minuscules avec tirets (ex. « college-jang »).
- Choisir mon enfant (si j'en ai plusieurs).
- Suivre ses notes et son bulletin (par semestre).
- Voir ses devoirs et son emploi du temps.
- Voir ses absences (visibles dès que l'école les signale, en ouvrant l'app — pas de
  notification automatique) et les JUSTIFIER en ligne.
- Échanger (messagerie 1-à-1) avec les professeurs et l'administration.
- Encadré « Vos données sont protégées » : vous ne voyez que votre enfant, école isolée.
```

---

## 6) Dossier de réalisation du projet (document A4, référence/portfolio)

```
[COLLER LE BLOC DE MARQUE]

Crée un DOSSIER DE RÉALISATION A4 portrait (couverture premium + ~5-6 pages) présentant le
projet Jàng de façon professionnelle (référence interne / portfolio). Couverture navy très
premium, intérieur soigné, infographies simples.

Contenu :
- Couverture : « Jàng — Plateforme SaaS de gestion scolaire · Dossier de réalisation ».
- Le projet en bref : SaaS multi-écoles pour le Sénégal, façon Pronote, 5 rôles
  (super-admin, admin école, professeur, élève, parent).
- Les fonctionnalités livrées (frise/grille) : authentification multi-rôles, notes, bulletins
  PDF (mention, rang, moyenne de classe, appréciations), emploi du temps, devoirs, absences,
  messagerie, tableaux de bord, onboarding des écoles, abonnements (suspension + échéance).
- Architecture (schéma simple) : Next.js (web + serveur) + Supabase (base de données, auth,
  fichiers) + hébergement Vercel.
- Sécurité & isolation multi-écoles : Row Level Security au niveau base de données ; protection
  des données des élèves mineurs.
- Pensé pour le Sénégal : mobile-first, léger, faible réseau, français.
- Modèle économique : abonnement récurrent, les parents paient un petit supplément.
- Chiffres clés (cartes) : 5 rôles, 22 migrations de base, ~38 écrans, déployé en ligne.
- Feuille de route : paiement mobile money (Wave/Orange Money), application installable (PWA),
  améliorations pédagogiques (QCM, alertes).

Style data-driven : cartes de chiffres, pictos, schéma d'architecture épuré, peu de texte.
```

---

## 7) (Bonus utile) Flyer A5 pour les parents — « Comment se connecter »

```
[COLLER LE BLOC DE MARQUE]

Crée un FLYER recto A5 (à distribuer aux parents à la rentrée) qui explique en 3 étapes
illustrées comment se connecter à Jàng. Fond navy premium, gros chiffres verts 1-2-3.

Contenu :
- Titre : « Suivez la scolarité de votre enfant, depuis votre téléphone. »
- Étape 1 : Rendez-vous sur www.jang.sn
- Étape 2 : Connectez-vous avec VOTRE matricule parent + le CODE de l'école
  (les deux remis par l'établissement). Chaque parent a son propre compte, distinct
  de celui de l'enfant.
- Étape 3 : Consultez notes, devoirs, absences et échangez avec les professeurs.
- Bas de page : logo Jàng + « Jàng — apprendre, en wolof » + espace pour le cachet de l'école.
```

---

## 8) Page vitrine (landing page du site) — premium, vivante, « esprit savoir »

```
[COLLER LE BLOC DE MARQUE]

Conçois une LANDING PAGE (page vitrine) premium et vivante pour Jàng — l'écran que voit un
directeur d'école qui découvre la plateforme. Objectif : qu'en 5 secondes il ressente
« c'est sérieux, c'est moderne, c'est fait pour nous » et clique sur « Inscrire mon école ».

Esprit fondateur à faire ressentir : LE SAVOIR COMME LUMIÈRE — l'idée que nommer et
apprendre élève l'être humain (« Jàng » = apprendre/lire en wolof). Ce n'est pas un SaaS
générique, c'est une plateforme du savoir.

Direction artistique (anti-générique — le plus important) :
- Un CONCEPT VISUEL fort et filé sur toute la page autour du SAVOIR / de la LUMIÈRE : ex.
  des points lumineux reliés comme une constellation de connaissances, un dégradé de lumière
  verte qui perce le navy, des noms de matières qui apparaissent comme des étoiles. Un vrai
  fil conducteur, pas un décor plaqué.
- HERO immersif : grand titre éditorial (typo à fort contraste de graisses), fond navy avec
  profondeur (glow vert diffus, grain léger, halo) et une mise en situation produit (maquette
  de l'app dans un téléphone : écran emploi du temps ou bulletin visible). Asymétrie assumée,
  PAS le sempiternel « texte à gauche / image à droite » centré.
- Sections rythmées (alternance de fonds, respirations généreuses, jamais 6 cartes identiques
  alignées) : 1) Hero + accroche ; 2) le problème/promesse « la vie scolaire enfin réunie » ;
  3) les fonctions clés comme une EXPÉRIENCE (notes & bulletins, emploi du temps, devoirs,
  absences, messagerie, tableau de bord) avec de vraies captures stylisées ; 4) « un espace
  pour chacun » (admin, prof, élève, parent) ; 5) confiance / protection des données des
  mineurs (isolation par école) ; 6) un mot sur l'esprit Jàng (le savoir qui éclaire, ancrage
  sénégalais) ; 7) appel final fort « Inscrire mon école ».
- Détails premium : micro-ombres douces, bordures fines lumineuses, cartes glassmorphism
  subtil sur le navy, iconographie fine et cohérente (PAS d'emojis), typographie soignée
  (propose un couple de polices), micro-animations au scroll (apparitions, parallax léger).
- Touche sénégalaise discrète et élégante (pas folklorique) : chaleur de visages d'élèves,
  lumière, fierté.

Donne 2 ou 3 directions différentes de HERO pour que je choisisse, puis la page complète dans
la direction la plus forte. Format desktop large + une variante mobile du hero.
```

---

## 7) Vidéo / animation de promotion (~60 s, 16:9)

> NB : Claude Design produit une ANIMATION web (HTML/CSS/JS) qui se joue dans le navigateur,
> sans son. Pour la version avec voix off, la vidéo MP4 officielle est générée dans le repo
> (`promo-video/`). Ce prompt sert à obtenir une variante animée (site, salon, écran d'accueil)
> ou à re-générer l'animation seule.

```
[COLLER LE BLOC DE MARQUE]

Crée une ANIMATION DE PROMOTION plein écran, format 16:9 (1920×1080), durée ~60 secondes,
qui se joue toute seule (autoplay, pas de scroll) et se termine sur un écran d'appel à
l'action. C'est un mini-film de présentation de Jàng, découpé en 8 scènes enchaînées par
de vraies transitions (fondus avec flou, glissements verticaux — JAMAIS de coupes sèches).

Direction artistique : navy profond avec profondeur (glow vert diffus, constellation de
points lumineux reliés — le fil conducteur « le savoir comme lumière »), accents verts
#22c55e, typographie éditoriale à fort contraste de graisses, éléments qui respirent
(animations d'ambiance lentes). Chaque scène : un fond texturé, un message central, et des
détails premium (étiquettes, filets, badges). Grands titres (≥ 70px), une idée par scène.

Les 8 scènes (avec le texte affiché à l'écran) :
1. ACCROCHE (~6 s) — Question plein écran : « Et si toute la vie de votre école tenait
   dans votre poche ? » sur fond constellation, noms de matières qui scintillent en étoiles
   (✦ Mathématiques, ✦ Français, ✦ Sciences…).
2. LE PROBLÈME (~8 s) — 3 constats qui tombent en cascade : « Des notes sur des cahiers » /
   « Des bulletins recopiés à la main » / « Des parents tenus à l'écart ». Ambiance plus
   sombre, accents ambre.
3. LA RÉVÉLATION (~7 s) — Le logo J claque à l'écran avec son halo vert, « Jàng », puis
   « La plateforme scolaire tout-en-un, pensée pour le Sénégal » + badge « “Jàng” —
   apprendre, en wolof ». Téléphone avec l'app qui glisse depuis la droite. Moment fort.
4. NOTES & BULLETINS (~8 s) — Écran scindé : à gauche « Du carnet de notes au bulletin
   officiel, sans recopie » (moyennes, rangs, mentions calculés automatiquement) ; à droite
   une maquette de bulletin qui se révèle avec un zoom lent.
5. LE QUOTIDIEN (~8 s) — Emploi du temps dans un téléphone à gauche ; à droite 4 pastilles
   qui cascadent : Emploi du temps / Devoirs / Absences & appel / Messagerie + badge
   « Léger — pensé pour peu de réseau ».
6. UN ESPACE POUR CHACUN (~11 s) — Rupture LUMINEUSE (fond clair #f8fafc) : 4 cartes rôles
   qui entrent en quinconce : Direction (pilotage temps réel), Professeurs (moins de
   paperasse), Élèves (tout dans la poche), Parents (enfin dans la boucle).
7. CONFIANCE (~7 s) — Retour au navy : bouclier vert au halo pulsant + 3 coches : « Chaque
   école totalement isolée » / « Accès strictement par rôle » / « Données des mineurs
   protégées ».
8. FINAL (~7 s) — « Donnez à votre école la plateforme qu'elle mérite. » + bouton
   « Inscrire mon école » + logo J qui respire + adresse du site. Fondu de fermeture.

Contraintes d'animation : chaque élément ENTRE en animation (aucun élément ne pop tout
formé), directions et courbes variées (pas tout depuis le bas), décors animés en continu
(halos qui pulsent, étoiles qui scintillent, constellation qui dérive). Rythme :
calme → tension → RÉVÉLATION → démonstration → respiration claire → confiance → final.
```

---

## 9) Flyer A5 de PROSPECTION (recto-verso, à distribuer partout)

> Différent du flyer n°7 (réservé aux parents d'une école déjà cliente). Celui-ci se
> distribue « dans la nature » : écoles, commerces, événements. Il doit donner envie
> ET permettre d'agir (site + contact). Avant de coller le prompt, remplacer
> `[NUMÉRO WHATSAPP]` par le vrai numéro.

```
[COLLER LE BLOC DE MARQUE]

Crée un FLYER A5 RECTO-VERSO de prospection pour Jàng, à distribuer largement (écoles
privées, salons, quartiers). Cible principale : directeurs et fondateurs de collèges/lycées
privés ; cible secondaire : professeurs et parents qui peuvent en parler à leur école.
Fond navy premium, accents verts, très lisible à bout de bras (gros titres).

RECTO — donner envie en 5 secondes :
- En haut : logo J + « Jàng » + baseline « La vie scolaire, simplifiée. »
- Grande accroche : « Toute votre école dans votre poche. »
- Sous-accroche : « Notes, bulletins, emploi du temps, devoirs, absences, messagerie —
  une seule plateforme, pensée pour les écoles du Sénégal. »
- Grille de 6 fonctions avec pictos fins (PAS d'emojis) : Notes & moyennes ·
  Bulletins PDF automatiques (mention, rang, moyenne de classe) · Emploi du temps ·
  Devoirs · Appel & absences · Messagerie école-familles.
- Bandeau bas : « 100 % français · Léger, marche avec peu de réseau · Sur n'importe
  quel téléphone » + www.jang.sn en gros + QR code (placeholder) vers le site.

VERSO — convaincre le directeur et déclencher le contact :
- Titre : « Directeur, directrice : votre école ne débourse rien. »
- 3 arguments en cartes :
  1. « Les parents paient » : un petit supplément de ~400-500 F CFA par élève et par
     mois ajouté aux frais de scolarité — l'école collecte, la plateforme travaille.
  2. « Vos bulletins, sans recopie » : moyennes (devoirs + composition), rangs et
     mentions calculés automatiquement, bulletins imprimables pour toute une classe.
  3. « Vos données protégées » : chaque école totalement isolée, accès strictement
     par rôle, données des élèves mineurs traitées avec soin.
- Encadré vert « Offre rentrée 2026 » : installation de votre école + formation de
  vos professeurs INCLUSES pour les premières écoles inscrites.
- Appel à l'action final : « Demandez une démonstration de 15 minutes sur votre
  téléphone » + WhatsApp [NUMÉRO WHATSAPP] + www.jang.sn + QR code.
- Bas de page : logo + « “Jàng” — apprendre, en wolof ».
```
