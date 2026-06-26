import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";

type Classe = { id: string; nom: string };
type Eleve = { id: string; classe_id: string | null };

// Une note agrégée : sa valeur, l'élève, sa classe et le coef de sa matière.
type NoteAgg = {
  valeur: number;
  eleve_id: string;
  affectation: {
    classe_id: string;
    matiere: { nom: string; coefficient_defaut: number } | null;
  } | null;
};

type AbsenceAgg = {
  statut: string;
  justifie: boolean;
  affectation: { classe_id: string } | null;
};

type DerniereNote = {
  valeur: number;
  date_evaluation: string;
  eleve: { prenom: string; nom: string } | null;
  affectation: { matiere: { nom: string } | null } | null;
};

type DernierDevoir = {
  titre: string;
  created_at: string;
  affectation: {
    matiere: { nom: string } | null;
    classe: { nom: string } | null;
  } | null;
};

// Moyenne générale /20 d'un élève à partir de ses notes : moyenne simple par
// matière, puis pondérée par le coefficient de la matière (même règle que le bulletin).
function moyenneGenerale(notes: NoteAgg[]): number | null {
  const parMatiere = new Map<string, { coef: number; valeurs: number[] }>();
  for (const n of notes) {
    const nom = n.affectation?.matiere?.nom ?? "Autres";
    const coef = Number(n.affectation?.matiere?.coefficient_defaut ?? 1);
    const entree = parMatiere.get(nom) ?? { coef, valeurs: [] };
    entree.valeurs.push(Number(n.valeur));
    parMatiere.set(nom, entree);
  }
  let totalPoints = 0;
  let totalCoef = 0;
  for (const { coef, valeurs } of parMatiere.values()) {
    if (valeurs.length === 0) continue;
    const moy = valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
    totalPoints += moy * coef;
    totalCoef += coef;
  }
  return totalCoef > 0 ? totalPoints / totalCoef : null;
}

export default async function TableauDeBordPage({
  searchParams,
}: {
  searchParams: Promise<{ semestre?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé à l'administrateur d'école.
  if (profil.role !== "admin_ecole") {
    redirect("/");
  }

  const { semestre } = await searchParams;
  const sem = semestre === "2" ? 2 : 1;
  const libelleSemestre = sem === 1 ? "1ᵉʳ semestre" : "2ᵉ semestre";

  // Année active (pour ne compter que les classes en cours).
  const { data: annees } = await supabase
    .from("annees_scolaires")
    .select("id, libelle, active")
    .returns<{ id: string; libelle: string; active: boolean }[]>();
  const anneeActive = (annees ?? []).find((a) => a.active) ?? (annees ?? [])[0] ?? null;

  // Classes de l'année active.
  let classes: Classe[] = [];
  if (anneeActive) {
    const { data } = await supabase
      .from("classes")
      .select("id, nom")
      .eq("annee_scolaire_id", anneeActive.id)
      .order("nom", { ascending: true })
      .returns<Classe[]>();
    classes = data ?? [];
  }

  // Effectifs.
  const { data: eleves } = await supabase
    .from("profils")
    .select("id, classe_id")
    .eq("role", "eleve")
    .returns<Eleve[]>();

  const { count: nbProfs } = await supabase
    .from("profils")
    .select("id", { count: "exact", head: true })
    .eq("role", "professeur");

  const { count: nbParents } = await supabase
    .from("profils")
    .select("id", { count: "exact", head: true })
    .eq("role", "parent");

  const nbEleves = eleves?.length ?? 0;

  // Notes du semestre choisi (pour les moyennes par classe).
  const { data: notes } = await supabase
    .from("notes")
    .select(
      "valeur, eleve_id, affectation:affectations ( classe_id, matiere:matieres ( nom, coefficient_defaut ) )"
    )
    .eq("semestre", sem)
    .returns<NoteAgg[]>();

  // Moyenne de chaque classe = moyenne des moyennes générales de ses élèves notés.
  const moyennesParClasse = classes.map((classe) => {
    const elevesClasse = (eleves ?? []).filter((e) => e.classe_id === classe.id);
    const moyennesEleves = elevesClasse
      .map((e) => moyenneGenerale((notes ?? []).filter((n) => n.eleve_id === e.id)))
      .filter((m): m is number => m !== null);
    const moyenne =
      moyennesEleves.length > 0
        ? moyennesEleves.reduce((s, m) => s + m, 0) / moyennesEleves.length
        : null;
    return {
      id: classe.id,
      nom: classe.nom,
      effectif: elevesClasse.length,
      notes: moyennesEleves.length,
      moyenne,
    };
  });

  // Absences (toutes années confondues).
  const { data: absences } = await supabase
    .from("absences")
    .select("statut, justifie, affectation:affectations ( classe_id )")
    .returns<AbsenceAgg[]>();

  const totalAbsents = (absences ?? []).filter((a) => a.statut === "absent").length;
  const totalRetards = (absences ?? []).filter((a) => a.statut === "retard").length;
  const totalJustifies = (absences ?? []).filter((a) => a.justifie).length;
  const totalAbsences = absences?.length ?? 0;
  const partJustifiee =
    totalAbsences > 0 ? Math.round((totalJustifies / totalAbsences) * 100) : null;

  // Absences par classe (les plus touchées d'abord).
  const absParClasse = new Map<string, number>();
  for (const a of absences ?? []) {
    const cid = a.affectation?.classe_id;
    if (cid) absParClasse.set(cid, (absParClasse.get(cid) ?? 0) + 1);
  }
  const classesAbsences = classes
    .map((c) => ({ nom: c.nom, total: absParClasse.get(c.id) ?? 0 }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Dernière activité : dernières notes saisies + derniers devoirs donnés.
  const { data: dernieresNotes } = await supabase
    .from("notes")
    .select(
      "valeur, date_evaluation, eleve:profils ( prenom, nom ), affectation:affectations ( matiere:matieres ( nom ) )"
    )
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<DerniereNote[]>();

  const { data: derniersDevoirs } = await supabase
    .from("devoirs")
    .select(
      "titre, created_at, affectation:affectations ( matiere:matieres ( nom ), classe:classes ( nom ) )"
    )
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<DernierDevoir[]>();

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500">
            {profil.prenom} {profil.nom} — Administrateur
            {anneeActive ? ` · ${anneeActive.libelle}` : ""}
          </p>
        </div>
        <Link
          href="/ecole"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Retour
        </Link>
      </header>

      {/* Effectifs */}
      <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Classes", valeur: classes.length },
          { label: "Élèves", valeur: nbEleves },
          { label: "Professeurs", valeur: nbProfs ?? 0 },
          { label: "Parents", valeur: nbParents ?? 0 },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-3xl font-bold text-gray-900">{c.valeur}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
      </section>

      {/* Sélecteur de semestre (pour les moyennes) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Moyennes par classe</h2>
        <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 text-sm">
          {([1, 2] as const).map((s) => (
            <Link
              key={s}
              href={`/ecole/tableau-de-bord?semestre=${s}`}
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
      </div>

      {/* Moyennes par classe */}
      <section className="mb-10">
        {moyennesParClasse.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Aucune classe pour l&apos;année en cours.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {moyennesParClasse.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{c.nom}</p>
                  <p className="text-sm text-gray-500">
                    {c.effectif} élève{c.effectif > 1 ? "s" : ""} ·{" "}
                    {c.notes} noté{c.notes > 1 ? "s" : ""} ce {libelleSemestre.toLowerCase()}
                  </p>
                </div>
                <span
                  className={
                    "rounded-lg px-3 py-1 text-sm font-semibold " +
                    (c.moyenne === null
                      ? "bg-gray-100 text-gray-400"
                      : c.moyenne >= 10
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700")
                  }
                >
                  {c.moyenne !== null ? `${c.moyenne.toFixed(2)}/20` : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Absences */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Absences</h2>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Absences", valeur: totalAbsents },
            { label: "Retards", valeur: totalRetards },
            { label: "Justifiées", valeur: totalJustifies },
            {
              label: "Part justifiée",
              valeur: partJustifiee !== null ? `${partJustifiee}%` : "—",
            },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-2xl font-bold text-gray-900">{c.valeur}</p>
              <p className="text-sm text-gray-500">{c.label}</p>
            </div>
          ))}
        </div>
        {classesAbsences.length > 0 ? (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {classesAbsences.map((c) => (
              <li
                key={c.nom}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="font-medium text-gray-900">{c.nom}</span>
                <span className="text-sm text-gray-600">
                  {c.total} absence{c.total > 1 ? "s" : ""}/retard{c.total > 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Aucune absence enregistrée. 🎉
          </p>
        )}
      </section>

      {/* Dernière activité */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Dernières notes</h2>
          {!dernieresNotes || dernieresNotes.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Aucune note saisie.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {dernieresNotes.map((n, i) => (
                <li key={i} className="px-4 py-2.5">
                  <p className="font-medium text-gray-900">
                    {n.eleve ? `${n.eleve.prenom} ${n.eleve.nom}` : "—"} —{" "}
                    {n.valeur}/20
                  </p>
                  <p className="text-sm text-gray-500">
                    {n.affectation?.matiere?.nom ?? "—"} · {n.date_evaluation}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Derniers devoirs</h2>
          {!derniersDevoirs || derniersDevoirs.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Aucun devoir donné.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {derniersDevoirs.map((d, i) => (
                <li key={i} className="px-4 py-2.5">
                  <p className="font-medium text-gray-900">{d.titre}</p>
                  <p className="text-sm text-gray-500">
                    {d.affectation?.matiere?.nom ?? "—"}
                    {d.affectation?.classe ? ` · ${d.affectation.classe.nom}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
