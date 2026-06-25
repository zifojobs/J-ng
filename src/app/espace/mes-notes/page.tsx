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
  affectation: { matiere: { nom: string; coefficient_defaut: number } | null } | null;
};

// Moyenne /20 d'une matière (moyenne simple des notes ; le coefficient de la
// matière, lui, sert seulement à la moyenne générale).
function moyenne(notes: Note[]): number | null {
  if (notes.length === 0) return null;
  const somme = notes.reduce((s, n) => s + Number(n.valeur), 0);
  return somme / notes.length;
}

export default async function MesNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ semestre?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé aux élèves.
  if (profil.role !== "eleve") {
    redirect("/");
  }

  const { semestre } = await searchParams;
  const sem = semestre === "2" ? 2 : 1;
  const libelleSemestre = sem === 1 ? "1ᵉʳ semestre" : "2ᵉ semestre";

  // La RLS garantit déjà que l'élève ne reçoit QUE ses propres notes.
  const { data: notes } = await supabase
    .from("notes")
    .select(
      "id, type, titre, valeur, coefficient, date_evaluation, affectation:affectations ( matiere:matieres ( nom, coefficient_defaut ) )"
    )
    .eq("eleve_id", profil.id)
    .eq("semestre", sem)
    .order("date_evaluation", { ascending: false })
    .returns<Note[]>();

  // Regrouper par matière (en gardant le coefficient de chaque matière).
  const parMatiere = new Map<string, { coef: number; notes: Note[] }>();
  for (const n of notes ?? []) {
    const nom = n.affectation?.matiere?.nom ?? "Autres";
    const coef = Number(n.affectation?.matiere?.coefficient_defaut ?? 1);
    const entree = parMatiere.get(nom) ?? { coef, notes: [] };
    entree.notes.push(n);
    parMatiere.set(nom, entree);
  }
  const lignes = [...parMatiere.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([nom, { coef, notes: liste }]) => ({ nom, coef, notes: liste, moyenne: moyenne(liste) }));

  // Moyenne générale = somme(moyenne × coef) ÷ somme(coef), matières notées seulement.
  const notees = lignes.filter((l) => l.moyenne !== null);
  const totalCoef = notees.reduce((s, l) => s + l.coef, 0);
  const totalPoints = notees.reduce((s, l) => s + (l.moyenne ?? 0) * l.coef, 0);
  const moyenneGenerale = totalCoef > 0 ? totalPoints / totalCoef : null;

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
            href={`/espace/mes-notes/bulletin?semestre=${sem}`}
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

      {/* Choix du semestre */}
      <div className="mb-6 inline-flex overflow-hidden rounded-lg border border-gray-300 text-sm">
        {([1, 2] as const).map((s) => (
          <Link
            key={s}
            href={`/espace/mes-notes?semestre=${s}`}
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

      {!notes || notes.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Pas de notes pour le {libelleSemestre}.
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
            {lignes.map((l) => (
              <section
                key={l.nom}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {l.nom}{" "}
                    <span className="text-sm font-normal text-gray-500">(coef {l.coef})</span>
                  </h2>
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
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
