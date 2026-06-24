// Outils partagés pour les connexions par matricule (élèves, parents).
//
// Un élève n'a pas de vrai email : on lui fabrique un email "technique"
// à partir de son matricule et du code (slug) de son école.
// La MÊME fonction sert à l'inscription (création du compte) et au login,
// pour que les deux produisent rigoureusement le même email.

// Nettoie un texte en slug simple : minuscules, sans accents,
// uniquement lettres/chiffres/tirets. Ex. "Collège Jàng" -> "college-jang".
export function nettoyerSlug(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // enlève les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Nettoie un matricule pour qu'il tienne dans un email (garde aussi les points).
export function nettoyerMatricule(matricule: string): string {
  return matricule
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Construit l'email technique d'un compte sans vrai email.
// Ex. matricule "ELV-2026-001" + slug "college-jang"
//     -> "elv-2026-001@college-jang.jang.local"
export function emailTechnique(matricule: string, slugEcole: string): string {
  return `${nettoyerMatricule(matricule)}@${nettoyerSlug(slugEcole)}.jang.local`;
}
