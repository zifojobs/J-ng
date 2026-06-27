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
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mes notes</h1>
            <p className="text-sm text-slate-400">
              {profil.prenom} {profil.nom} — Élève
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/espace/mes-notes/bulletin?semestre=${sem}`}
              className="rounded-xl bg-green-500 px-3 py-1.5 text-sm font-semibold text-slate-900 transition hover:bg-green-400"
            >
              Voir le bulletin
            </Link>
            <Link
              href="/espace"
              className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              ← Retour
            </Link>
          </div>
        </header>

        {/* Choix du semestre */}
        <div className="mb-6 inline-flex rounded-xl bg-slate-800/60 p-1 text-sm font-medium">
          {([1, 2] as const).map((s) => (
            <Link
              key={s}
              href={`/espace/mes-notes?semestre=${s}`}
              className={
                "rounded-lg px-3 py-1.5 transition " +
                (s === sem
                  ? "bg-green-500 text-slate-900"
                  : "text-slate-300 hover:text-white")
              }
            >
              {s === 1 ? "1ᵉʳ semestre" : "2ᵉ semestre"}
            </Link>
          ))}
        </div>

        {!notes || notes.length === 0 ? (
          <p className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Pas de notes pour le {libelleSemestre}.
          </p>
        ) : (
          <>
            {/* Moyenne générale */}
            <section className="mb-8 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
              <p className="text-lg font-semibold text-white">Moyenne générale</p>
              <p className="text-2xl font-bold text-green-400">
                {moyenneGenerale !== null ? moyenneGenerale.toFixed(2) : "—"}
                <span className="text-base font-normal text-slate-500">/20</span>
              </p>
            </section>

            {/* Notes par matière */}
            <div className="flex flex-col gap-6">
              {lignes.map((l) => (
                <section
                  key={l.nom}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                    <h2 className="text-lg font-semibold text-white">
                      {l.nom}{" "}
                      <span className="text-sm font-normal text-slate-400">(coef {l.coef})</span>
                    </h2>
                    <p className="text-sm font-medium text-slate-300">
                      Moyenne : {l.moyenne !== null ? l.moyenne.toFixed(2) : "—"}/20
                    </p>
                  </div>
                  <ul className="divide-y divide-slate-800">
                    {l.notes.map((n) => (
                      <li
                        key={n.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-white">
                            {n.type === "composition" ? "Composition" : "Devoir"}
                            {n.titre ? ` « ${n.titre} »` : ""}
                          </p>
                          <p className="text-sm text-slate-500">{n.date_evaluation}</p>
                        </div>
                        <p className="text-lg font-bold text-white">
                          {n.valeur}
                          <span className="text-sm font-normal text-slate-500">/20</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
