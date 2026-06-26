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
  affectation: { matiere: { nom: string; coefficient_defaut: number } | null } | null;
};

// Moyenne /20 d'une matière (moyenne simple des notes ; le coefficient de la
// matière sert seulement à la moyenne générale).
function moyenne(notes: Note[]): number | null {
  if (notes.length === 0) return null;
  const somme = notes.reduce((s, n) => s + Number(n.valeur), 0);
  return somme / notes.length;
}

export default async function EnfantsPage({
  searchParams,
}: {
  searchParams: Promise<{ semestre?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé aux parents.
  if (profil.role !== "parent") {
    redirect("/");
  }

  const { semestre } = await searchParams;
  const sem = semestre === "2" ? 2 : 1;
  const libelleSemestre = sem === 1 ? "1ᵉʳ semestre" : "2ᵉ semestre";

  // Les enfants rattachés à ce parent (RLS = ses propres liens).
  const { data: liens } = await supabase
    .from("parents_eleves")
    .select("eleve:profils!parents_eleves_eleve_id_fkey ( id, prenom, nom )")
    .eq("parent_id", profil.id)
    .returns<Lien[]>();

  const enfants = (liens ?? [])
    .map((l) => l.eleve)
    .filter((e): e is NonNullable<Lien["eleve"]> => e !== null);

  // Toutes les notes du semestre choisi (la RLS ne laisse passer que celles des enfants).
  const { data: notes } = await supabase
    .from("notes")
    .select(
      "id, type, titre, valeur, coefficient, date_evaluation, eleve_id, affectation:affectations ( matiere:matieres ( nom, coefficient_defaut ) )"
    )
    .eq("semestre", sem)
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

      {/* Choix du semestre */}
      <div className="mb-8 inline-flex overflow-hidden rounded-lg border border-gray-300 text-sm">
        {([1, 2] as const).map((s) => (
          <Link
            key={s}
            href={`/espace/enfants?semestre=${s}`}
            className={
              "px-3 py-1.5 " +
              (s === sem
                ? "bg-gray-900 font-medium text-white"
                : "bg-white text-gray-700 hover:bg-gray-100")
            }
          >
            {s === 1 ? "1ᵉʳ semestre" : "2ᵉ semestre"}
          </Link>
        ))}
      </div>

      {enfants.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucun enfant n&apos;est rattaché à votre compte. Contactez l&apos;école.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {enfants.map((enfant) => {
            const notesEnfant = notesParEnfant(enfant.id);

            // Regrouper par matière (en gardant le coefficient de chaque matière).
            const parMatiere = new Map<string, { coef: number; notes: Note[] }>();
            for (const n of notesEnfant) {
              const nom = n.affectation?.matiere?.nom ?? "Autres";
              const coef = Number(n.affectation?.matiere?.coefficient_defaut ?? 1);
              const entree = parMatiere.get(nom) ?? { coef, notes: [] };
              entree.notes.push(n);
              parMatiere.set(nom, entree);
            }
            const lignes = [...parMatiere.entries()]
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([nom, { coef, notes: liste }]) => ({
                nom,
                coef,
                notes: liste,
                moyenne: moyenne(liste),
              }));

            const notees = lignes.filter((l) => l.moyenne !== null);
            const totalCoef = notees.reduce((s, l) => s + l.coef, 0);
            const totalPoints = notees.reduce((s, l) => s + (l.moyenne ?? 0) * l.coef, 0);
            const moyenneGenerale = totalCoef > 0 ? totalPoints / totalCoef : null;

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
                      href={`/espace/enfants/${enfant.id}/devoirs`}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Devoirs
                    </Link>
                    <Link
                      href={`/espace/enfants/${enfant.id}/emploi-du-temps`}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Emploi du temps
                    </Link>
                    <Link
                      href={`/espace/enfants/${enfant.id}/bulletin?semestre=${sem}`}
                      className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      Bulletin
                    </Link>
                  </div>
                </div>

                {notesEnfant.length === 0 ? (
                  <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Pas de notes pour le {libelleSemestre}.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {lignes.map((l) => (
                      <div
                        key={l.nom}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                      >
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                          <h3 className="font-semibold text-gray-900">
                            {l.nom}{" "}
                            <span className="text-sm font-normal text-gray-500">
                              (coef {l.coef})
                            </span>
                          </h3>
                          <p className="text-sm font-medium text-gray-700">
                            Moyenne : {l.moyenne !== null ? l.moyenne.toFixed(2) : "—"}/20
                          </p>
                        </div>
                        <ul className="divide-y divide-gray-200">
                          {l.notes.map((n) => (
                            <li
                              key={n.id}
                              className="flex items-center justify-between gap-3 px-4 py-3"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {n.type === "composition" ? "Composition" : "Devoir"}
                                  {n.titre ? ` « ${n.titre} »` : ""}
                                </p>
                                <p className="text-sm text-gray-500">{n.date_evaluation}</p>
                              </div>
                              <p className="text-lg font-bold text-gray-900">
                                {n.valeur}
                                <span className="text-sm font-normal text-gray-500">/20</span>
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
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
