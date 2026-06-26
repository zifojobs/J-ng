// Affichage en lecture seule d'une liste de devoirs (vue élève / parent).
// Les devoirs sont séparés en « À venir » (sans date, ou date >= aujourd'hui)
// et « Passés », chacun trié par date à rendre.

export type DevoirAffiche = {
  id: string;
  titre: string;
  consigne: string | null;
  date_pour_le: string | null;
  matiere: string;
  professeur: string;
};

// « 2026-06-30 » -> « 30/06/2026 » (chaîne vide si pas de date).
function dateLisible(iso: string | null): string {
  if (!iso) return "";
  const [a, m, j] = iso.split("-");
  return j && m && a ? `${j}/${m}/${a}` : iso;
}

function Carte({ d }: { d: DevoirAffiche }) {
  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{d.titre}</p>
          <p className="text-sm text-gray-500">
            {d.matiere} · {d.professeur}
          </p>
        </div>
        {d.date_pour_le ? (
          <span className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-700">
            {dateLisible(d.date_pour_le)}
          </span>
        ) : null}
      </div>
      {d.consigne ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{d.consigne}</p>
      ) : null}
    </li>
  );
}

export function ListeDevoirs({ devoirs }: { devoirs: DevoirAffiche[] }) {
  if (devoirs.length === 0) {
    return (
      <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
        Aucun devoir pour le moment.
      </p>
    );
  }

  // « Aujourd'hui » au format AAAA-MM-JJ pour comparer aux dates des devoirs.
  const aujourdhui = new Date().toLocaleDateString("fr-CA"); // ex. 2026-06-26

  const aVenir = devoirs
    .filter((d) => !d.date_pour_le || d.date_pour_le >= aujourdhui)
    .sort((a, b) => (a.date_pour_le ?? "9999").localeCompare(b.date_pour_le ?? "9999"));

  const passes = devoirs
    .filter((d) => d.date_pour_le && d.date_pour_le < aujourdhui)
    .sort((a, b) => (b.date_pour_le ?? "").localeCompare(a.date_pour_le ?? ""));

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          À venir ({aVenir.length})
        </h2>
        {aVenir.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun devoir à venir.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {aVenir.map((d) => (
              <Carte key={d.id} d={d} />
            ))}
          </ul>
        )}
      </section>

      {passes.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Passés ({passes.length})
          </h2>
          <ul className="flex flex-col gap-3">
            {passes.map((d) => (
              <Carte key={d.id} d={d} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
