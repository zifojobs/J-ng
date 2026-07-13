// Affichage d'une liste d'absences (vue élève / parent), la plus récente d'abord.
// Si `justification` est fourni (vue parent), un formulaire permet de justifier
// chaque absence non encore justifiée.

import { justifierAbsence } from "@/app/espace/absences/actions";

export type AbsenceAffiche = {
  id: string;
  date_absence: string;
  statut: string;
  justifie: boolean;
  motif: string | null;
  matiere: string;
  professeur: string;
};

// « 2026-06-30 » -> « 30/06/2026 ».
function dateLisible(iso: string): string {
  const [a, m, j] = iso.split("-");
  return j && m && a ? `${j}/${m}/${a}` : iso;
}

export function ListeAbsences({
  absences,
  justification,
}: {
  absences: AbsenceAffiche[];
  justification?: { enfantId: string };
}) {
  if (absences.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-800 bg-slate-800/30 px-4 py-3 text-sm text-slate-400">
        Aucune absence enregistrée. 🎉
      </p>
    );
  }

  const absents = absences.filter((a) => a.statut === "absent").length;
  const retards = absences.filter((a) => a.statut === "retard").length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">
        {absents} absence{absents > 1 ? "s" : ""} · {retards} retard
        {retards > 1 ? "s" : ""}
      </p>

      <ul className="flex flex-col gap-3">
        {absences.map((a) => (
          <li key={a.id} className="rounded-2xl border border-slate-800 bg-slate-800/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-white">
                  {dateLisible(a.date_absence)} — {a.matiere}
                </p>
                <p className="text-sm text-slate-400">{a.professeur}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  className={
                    "rounded-lg px-2.5 py-1 text-sm font-medium " +
                    (a.statut === "absent"
                      ? "bg-red-500/10 text-red-300"
                      : "bg-amber-500/10 text-amber-300")
                  }
                >
                  {a.statut === "absent" ? "Absent" : "En retard"}
                </span>
                {a.justifie ? (
                  <span className="rounded-lg bg-green-500/10 px-2.5 py-1 text-sm font-medium text-green-300">
                    Justifié
                  </span>
                ) : null}
              </div>
            </div>

            {a.justifie && a.motif ? (
              <p className="mt-2 text-sm italic text-slate-400">« {a.motif} »</p>
            ) : null}

            {/* Vue parent : formulaire pour justifier une absence non justifiée */}
            {justification && !a.justifie ? (
              <form action={justifierAbsence} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="enfant_id" value={justification.enfantId} />
                {/* Liste fermée (pas de saisie libre) : évite de collecter une
                    donnée de santé détaillée — cf. docs/declaration-cdp.md (D3). */}
                <select
                  name="motif"
                  defaultValue=""
                  required
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="" disabled>
                    Choisir un motif…
                  </option>
                  <option value="Familial">Familial</option>
                  <option value="Médical">Médical</option>
                  <option value="Autre">Autre</option>
                </select>
                <div className="flex justify-end">
                  <button className="rounded-xl bg-green-500 px-4 py-1.5 text-sm font-semibold text-slate-900 transition hover:bg-green-400">
                    Justifier
                  </button>
                </div>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
