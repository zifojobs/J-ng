// Banque de petits messages affichés sur l'accueil de l'élève.
// But : motiver à chaque connexion et donner envie d'apprendre.
// - « encouragement » : adapté au niveau (bon, moyen, en difficulté).
// - « savoir » : une notion universelle (maths, sciences, culture) pour piquer la curiosité.

export type Encouragement = {
  texte: string;
  auteur?: string;
  type: "encouragement" | "savoir";
};

// Notions à apprendre, toutes matières — pour donner le goût d'étudier.
const SAVOIRS: Encouragement[] = [
  { type: "savoir", texte: "Théorème de Pythagore : dans un triangle rectangle, a² + b² = c²." },
  { type: "savoir", texte: "La somme des angles d'un triangle fait toujours 180°." },
  { type: "savoir", texte: "L'aire d'un cercle se calcule avec π × r² (r = le rayon)." },
  { type: "savoir", texte: "π ≈ 3,14159… un nombre infini dont les chiffres ne se répètent jamais." },
  { type: "savoir", texte: "La vitesse de la lumière est d'environ 300 000 km par seconde." },
  { type: "savoir", texte: "Au niveau de la mer, l'eau bout à 100 °C et gèle à 0 °C." },
  { type: "savoir", texte: "Le corps humain adulte compte 206 os." },
  { type: "savoir", texte: "Le fleuve Sénégal s'étend sur près de 1 800 km." },
  { type: "savoir", texte: "« Jàng » veut dire « apprendre » en wolof — c'est le nom de ton appli." },
  { type: "savoir", texte: "Un nombre est divisible par 3 si la somme de ses chiffres l'est aussi." },
];

// Aucun résultat encore : on accueille simplement.
const SANS_NIVEAU: Encouragement[] = [
  { type: "encouragement", texte: "Bienvenue 🌟 Chaque jour d'étude te rapproche de tes rêves." },
  { type: "encouragement", texte: "Le savoir est la seule richesse qui grandit quand on la partage." },
  { type: "encouragement", texte: "Une nouvelle journée, une nouvelle occasion d'apprendre. Bon courage !" },
];

// Bonne moyenne (≥ 14) : on félicite et on pousse à viser plus haut.
const BON: Encouragement[] = [
  { type: "encouragement", texte: "Excellent travail 👏 Continue, tu es sur une belle lancée !" },
  { type: "encouragement", texte: "Ta régularité paie. Vise encore plus haut, tu en es capable." },
  { type: "encouragement", texte: "Bravo pour tes efforts. La réussite aime la constance." },
];

// Niveau moyen (10 à 14) : on encourage à pousser un peu plus.
const MOYEN: Encouragement[] = [
  { type: "encouragement", texte: "Tu progresses bien 💪 Un petit effort de plus et tu brilleras." },
  { type: "encouragement", texte: "Chaque révision compte. Tu es sur la bonne voie !" },
  { type: "encouragement", texte: "Tu as tout ce qu'il faut pour aller plus loin. Garde le cap !" },
];

// En difficulté (< 10) : on rassure et on motive avec bienveillance.
const DIFFICULTE: Encouragement[] = [
  { type: "encouragement", texte: "Ne lâche rien 🌱 Les plus grands ont commencé par se tromper." },
  { type: "encouragement", texte: "Une difficulté aujourd'hui, c'est une force demain. Courage !" },
  { type: "encouragement", texte: "Le génie, c'est 1 % d'inspiration et 99 % de transpiration.", auteur: "Thomas Edison" },
  { type: "encouragement", texte: "Chaque expert a un jour été un débutant. Continue d'avancer." },
];

function choisir<T>(liste: T[]): T {
  return liste[Math.floor(Math.random() * liste.length)];
}

// Choisit un message : une fois sur deux une notion à apprendre,
// sinon un encouragement adapté au niveau de l'élève.
export function messageEncouragement(moyenne: number | null): Encouragement {
  if (Math.random() < 0.5) return choisir(SAVOIRS);

  let pool = SANS_NIVEAU;
  if (moyenne !== null) {
    if (moyenne >= 14) pool = BON;
    else if (moyenne >= 10) pool = MOYEN;
    else pool = DIFFICULTE;
  }
  return choisir(pool);
}
