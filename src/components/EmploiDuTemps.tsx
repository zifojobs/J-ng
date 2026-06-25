// Composant d'affichage (présentation seule) d'un emploi du temps : on lui
// passe une liste de créneaux déjà préparés, il les regroupe par jour.
// La sécurité (qui voit quoi) est assurée par la page appelante + la RLS.

export type CreneauAffiche = {
  id: string;
  jour: number; // 1 = lundi … 6 = samedi
  heure_debut: string;
  heure_fin: string;
  titre: string; // ex. nom de la matière (élève) ou nom de la classe (prof)
  sousTitre: string; // ex. le professeur (élève) ou la matière (prof)
  salle: string | null;
};

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

// hh:mm:ss -> hh:mm (Postgres renvoie l'heure avec les secondes).
const courteHeure = (h: string) => h.slice(0, 5);

export function EmploiDuTemps({ creneaux }: { creneaux: CreneauAffiche[] }) {
  if (creneaux.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Aucun cours dans l&apos;emploi du temps pour le moment.
      </p>
    );
  }

  const parJour = JOURS.map((nom, i) => ({
    nom,
    jour: i + 1,
    liste: creneaux
      .filter((c) => c.jour === i + 1)
      .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut)),
  })).filter((j) => j.liste.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {parJour.map((j) => (
        <div key={j.jour}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {j.nom}
          </h3>
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {j.liste.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <p className="font-medium text-gray-900">
                  {courteHeure(c.heure_debut)}–{courteHeure(c.heure_fin)} · {c.titre}
                </p>
                <p className="text-sm text-gray-500">
                  {c.sousTitre}
                  {c.salle ? ` · ${c.salle}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
