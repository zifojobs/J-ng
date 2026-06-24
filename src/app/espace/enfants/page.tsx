import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";

type Lien = {
  eleve: { id: string; prenom: string; nom: string } | null;
};

type Note = {
  id: string;
  type: string;
  titre: string | null;
  valeur: number;
  coefficient: number;
  date_evaluation: string;
  eleve_id: string;
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

export default async function EnfantsPage() {
  const { supabase, profil } = await requireProfil();

  // Réservé aux parents.
  if (profil.role !== "parent") {
    redirect("/");
  }

  // Les enfants rattachés à ce parent (RLS = ses propres liens).
  const { data: liens } = await supabase
    .from("parents_eleves")
    .select("eleve:profils!parents_eleves_eleve_id_fkey ( id, prenom, nom )")
    .eq("parent_id", profil.id)
    .returns<Lien[]>();

  const enfants = (liens ?? [])
    .map((l) => l.eleve)
    .filter((e): e is NonNullable<Lien["eleve"]> => e !== null);

  // Toutes les notes des enfants (la RLS ne laisse passer que celles-ci).
  const { data: notes } = await supabase
    .from("notes")
    .select(
      "id, type, titre, valeur, coefficient, date_evaluation, eleve_id, affectation:affectations ( matiere:matieres ( nom ) )"
    )
    .order("date_evaluation", { ascending: false })
    .returns<Note[]>();

  const notesParEnfant = (eleveId: string) =>
    (notes ?? []).filter((n) => n.eleve_id === eleveId);

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes de mon enfant</h1>
          <p className="text-sm text-gray-500">
            {profil.prenom} {profil.nom} — Parent
          </p>
        </div>
        <Link
          href="/espace"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Retour
        </Link>
      </header>

      {enfants.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucun enfant n&apos;est rattaché à votre compte. Contactez l&apos;école.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {enfants.map((enfant) => {
            const notesEnfant = notesParEnfant(enfant.id);

            // Regrouper par matière.
            const parMatiere = new Map<string, Note[]>();
            for (const n of notesEnfant) {
              const matiere = n.affectation?.matiere?.nom ?? "Autres";
              const liste = parMatiere.get(matiere) ?? [];
              liste.push(n);
              parMatiere.set(matiere, liste);
            }
            const matieres = [...parMatiere.entries()].sort((a, b) =>
              a[0].localeCompare(b[0])
            );
            const moyenneGenerale = moyenne(notesEnfant);

            return (
              <section key={enfant.id}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {enfant.prenom} {enfant.nom}
                  </h2>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-700">
                      Moyenne :{" "}
                      <span className="font-semibold">
                        {moyenneGenerale !== null ? moyenneGenerale.toFixed(2) : "—"}/20
                      </span>
                    </p>
                    <Link
                      href={`/espace/enfants/${enfant.id}/bulletin`}
                      className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      Bulletin
                    </Link>
                  </div>
                </div>

                {notesEnfant.length === 0 ? (
                  <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Pas encore de notes.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {matieres.map(([matiere, listeNotes]) => {
                      const moy = moyenne(listeNotes);
                      return (
                        <div
                          key={matiere}
                          className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                        >
                          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                            <h3 className="font-semibold text-gray-900">{matiere}</h3>
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
                                  <span className="text-sm font-normal text-gray-500">
                                    /20
                                  </span>
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
