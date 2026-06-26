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
      <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
        Aucune absence enregistrée. 🎉
      </p>
    );
  }

  const absents = absences.filter((a) => a.statut === "absent").length;
  const retards = absences.filter((a) => a.statut === "retard").length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        {absents} absence{absents > 1 ? "s" : ""} · {retards} retard
        {retards > 1 ? "s" : ""}
      </p>

      <ul className="flex flex-col gap-3">
        {absences.map((a) => (
          <li key={a.id} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {dateLisible(a.date_absence)} — {a.matiere}
                </p>
                <p className="text-sm text-gray-500">{a.professeur}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  className={
                    "rounded-lg px-2.5 py-1 text-sm font-medium " +
                    (a.statut === "absent"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-800")
                  }
                >
                  {a.statut === "absent" ? "Absent" : "En retard"}
                </span>
                {a.justifie ? (
                  <span className="rounded-lg bg-green-50 px-2.5 py-1 text-sm font-medium text-green-700">
                    Justifié
                  </span>
                ) : null}
              </div>
            </div>

            {a.justifie && a.motif ? (
              <p className="mt-2 text-sm italic text-gray-600">« {a.motif} »</p>
            ) : null}

            {/* Vue parent : formulaire pour justifier une absence non justifiée */}
            {justification && !a.justifie ? (
              <form action={justifierAbsence} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="enfant_id" value={justification.enfantId} />
                <textarea
                  name="motif"
                  rows={2}
                  maxLength={500}
                  placeholder="Motif de l'absence (ex. rendez-vous médical)…"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                />
                <div className="flex justify-end">
                  <button className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800">
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
