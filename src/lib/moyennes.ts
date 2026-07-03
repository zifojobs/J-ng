// Règle de calcul des moyennes, la MÊME partout : bulletin, espace élève,
// espace parent, tableau de bord admin — et la fonction SQL stats_classe_eleve
// (migration 0024) qui calcule le rang et la moyenne de classe.
//
// Moyenne d'une matière « à la sénégalaise » :
//   (moyenne des devoirs + note de composition) / 2
// Si l'un des deux manque (pas encore de composition, ou que des compositions),
// on prend celui qui existe.

type NoteMinimale = { type: string; valeur: number };

// Moyenne simple d'une liste de valeurs (null si vide).
function moyenneSimple(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null;
  return valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
}

// Moyennes d'une matière à partir de ses notes du semestre :
// moyenne des devoirs, moyenne des compositions, et moyenne de la matière.
export function moyennesMatiere(notes: NoteMinimale[]): {
  moyDevoirs: number | null;
  moyCompo: number | null;
  moyenne: number | null;
} {
  const moyDevoirs = moyenneSimple(
    notes.filter((n) => n.type === "devoir").map((n) => Number(n.valeur))
  );
  const moyCompo = moyenneSimple(
    notes.filter((n) => n.type === "composition").map((n) => Number(n.valeur))
  );
  const moyenne =
    moyDevoirs !== null && moyCompo !== null
      ? (moyDevoirs + moyCompo) / 2
      : moyDevoirs ?? moyCompo;
  return { moyDevoirs, moyCompo, moyenne };
}
