import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";

type Note = {
  id: string;
  type: string;
  titre: string | null;
  valeur: number;
  coefficient: number;
  date_evaluation: string;
  affectation: { matiere: { nom: string } | null } | null;
};

// Moyenne pondérée par les coefficients (ou null si aucune note).
function moyenne(notes: Note[]): number | null {
  if (notes.length === 0) return null;
  const sommeCoef = notes.reduce((s, n) => s + Number(n.coefficient), 0);
  if (sommeCoef === 0) return null;
  const sommePoints = notes.reduce((s, n) => s + Number(n.valeur) * Number(n.coefficient), 0);
  return sommePoints / sommeCoef;
}

export default async function MesNotesPage() {
  const { supabase, profil } = await requireProfil();

  // Réservé aux élèves.
  if (profil.role !== "eleve") {
    redirect("/");
  }

  // La RLS garantit déjà que l'élève ne reçoit QUE ses propres notes.
  const { data: notes } = await supabase
    .from("notes")
    .select(
      "id, type, titre, valeur, coefficient, date_evaluation, affectation:affectations ( matiere:matieres ( nom ) )"
    )
    .eq("eleve_id", profil.id)
    .order("date_evaluation", { ascending: false })
    .returns<Note[]>();

  // Regrouper les notes par matière.
  const parMatiere = new Map<string, Note[]>();
  for (const n of notes ?? []) {
    const matiere = n.affectation?.matiere?.nom ?? "Autres";
    const liste = parMatiere.get(matiere) ?? [];
    liste.push(n);
    parMatiere.set(matiere, liste);
  }
  const matieres = [...parMatiere.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const moyenneGenerale = moyenne(notes ?? []);

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes notes</h1>
          <p className="text-sm text-gray-500">
            {profil.prenom} {profil.nom} — Élève
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/espace/mes-notes/bulletin"
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Voir le bulletin
          </Link>
          <Link
            href="/espace"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            ← Retour
          </Link>
        </div>
      </header>

      {!notes || notes.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Vous n&apos;avez pas encore de notes.
        </p>
      ) : (
        <>
          {/* Moyenne générale */}
          <section className="mb-8 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-lg font-semibold text-gray-900">Moyenne générale</p>
            <p className="text-2xl font-bold text-gray-900">
              {moyenneGenerale !== null ? moyenneGenerale.toFixed(2) : "—"}
              <span className="text-base font-normal text-gray-500">/20</span>
            </p>
          </section>

          {/* Notes par matière */}
          <div className="flex flex-col gap-6">
            {matieres.map(([matiere, listeNotes]) => {
              const moy = moyenne(listeNotes);
              return (
                <section
                  key={matiere}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                >
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <h2 className="text-lg font-semibold text-gray-900">{matiere}</h2>
                    <p className="text-sm font-medium text-gray-700">
                      Moyenne : {moy !== null ? moy.toFixed(2) : "—"}/20
                    </p>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {listeNotes.map((n) => (
                      <li
                        key={n.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {n.type === "composition" ? "Composition" : "Devoir"}
                            {n.titre ? ` « ${n.titre} »` : ""}
                          </p>
                          <p className="text-sm text-gray-500">
                            coef {n.coefficient} · {n.date_evaluation}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {n.valeur}
                          <span className="text-sm font-normal text-gray-500">/20</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
