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
      <p className="rounded-2xl border border-slate-800 bg-slate-800/30 px-4 py-3 text-sm text-slate-400">
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
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            {j.nom}
          </h3>
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
            {j.liste.map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-4 py-3">
                <span className="shrink-0 font-mono text-sm font-semibold text-green-400">
                  {courteHeure(c.heure_debut)}
                </span>
                <span className="h-8 w-px shrink-0 bg-slate-700" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{c.titre}</p>
                  <p className="truncate text-sm text-slate-400">
                    {courteHeure(c.heure_debut)}–{courteHeure(c.heure_fin)} · {c.sousTitre}
                    {c.salle ? ` · ${c.salle}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
