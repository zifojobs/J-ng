import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { moyennesMatiere } from "@/lib/moyennes";

type Classe = { id: string; nom: string };
type Eleve = { id: string; classe_id: string | null };

// Une note agrégée : sa valeur, l'élève, sa classe et le coef de sa matière.
type NoteAgg = {
  type: string;
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

// Moyenne générale /20 d'un élève à partir de ses notes : moyenne par matière
// ((devoirs + compo) / 2), puis pondérée par le coefficient de la matière
// (même règle que le bulletin).
function moyenneGenerale(notes: NoteAgg[]): number | null {
  const parMatiere = new Map<string, { coef: number; notes: NoteAgg[] }>();
  for (const n of notes) {
    const nom = n.affectation?.matiere?.nom ?? "Autres";
    const coef = Number(n.affectation?.matiere?.coefficient_defaut ?? 1);
    const entree = parMatiere.get(nom) ?? { coef, notes: [] };
    entree.notes.push(n);
    parMatiere.set(nom, entree);
  }
  let totalPoints = 0;
  let totalCoef = 0;
  for (const { coef, notes: liste } of parMatiere.values()) {
    const moy = moyennesMatiere(liste).moyenne;
    if (moy === null) continue;
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
      "type, valeur, eleve_id, affectation:affectations ( classe_id, matiere:matieres ( nom, coefficient_defaut ) )"
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
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
            <p className="text-sm text-slate-400">
              {profil.prenom} {profil.nom} — Administrateur
              {anneeActive ? ` · ${anneeActive.libelle}` : ""}
            </p>
          </div>
          <Link
            href="/ecole"
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
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
            <div key={c.label} className="rounded-2xl border border-slate-800 bg-slate-800/30 p-4">
              <p className="text-3xl font-bold text-white">{c.valeur}</p>
              <p className="text-sm text-slate-400">{c.label}</p>
            </div>
          ))}
        </section>

        {/* Sélecteur de semestre (pour les moyennes) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Moyennes par classe</h2>
          <div className="inline-flex rounded-xl bg-slate-800/60 p-1 text-sm font-medium">
            {([1, 2] as const).map((s) => (
              <Link
                key={s}
                href={`/ecole/tableau-de-bord?semestre=${s}`}
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
        </div>

        {/* Moyennes par classe */}
        <section className="mb-10">
          {moyennesParClasse.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-800/30 px-4 py-3 text-sm text-slate-400">
              Aucune classe pour l&apos;année en cours.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
              {moyennesParClasse.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{c.nom}</p>
                    <p className="text-sm text-slate-400">
                      {c.effectif} élève{c.effectif > 1 ? "s" : ""} ·{" "}
                      {c.notes} noté{c.notes > 1 ? "s" : ""} ce {libelleSemestre.toLowerCase()}
                    </p>
                  </div>
                  <span
                    className={
                      "rounded-lg px-3 py-1 text-sm font-semibold " +
                      (c.moyenne === null
                        ? "bg-slate-700/50 text-slate-400"
                        : c.moyenne >= 10
                          ? "bg-green-500/10 text-green-300"
                          : "bg-red-500/10 text-red-300")
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
          <h2 className="mb-4 text-lg font-semibold text-white">Absences</h2>
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
              <div key={c.label} className="rounded-2xl border border-slate-800 bg-slate-800/30 p-4">
                <p className="text-2xl font-bold text-white">{c.valeur}</p>
                <p className="text-sm text-slate-400">{c.label}</p>
              </div>
            ))}
          </div>
          {classesAbsences.length > 0 ? (
            <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
              {classesAbsences.map((c) => (
                <li
                  key={c.nom}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="font-medium text-white">{c.nom}</span>
                  <span className="text-sm text-slate-400">
                    {c.total} absence{c.total > 1 ? "s" : ""}/retard{c.total > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-slate-800 bg-slate-800/30 px-4 py-3 text-sm text-slate-400">
              Aucune absence enregistrée. 🎉
            </p>
          )}
        </section>

        {/* Dernière activité */}
        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-white">Dernières notes</h2>
            {!dernieresNotes || dernieresNotes.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-800/30 px-4 py-3 text-sm text-slate-400">
                Aucune note saisie.
              </p>
            ) : (
              <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
                {dernieresNotes.map((n, i) => (
                  <li key={i} className="px-4 py-2.5">
                    <p className="font-medium text-white">
                      {n.eleve ? `${n.eleve.prenom} ${n.eleve.nom}` : "—"} —{" "}
                      {n.valeur}/20
                    </p>
                    <p className="text-sm text-slate-400">
                      {n.affectation?.matiere?.nom ?? "—"} · {n.date_evaluation}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold text-white">Derniers devoirs</h2>
            {!derniersDevoirs || derniersDevoirs.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-800/30 px-4 py-3 text-sm text-slate-400">
                Aucun devoir donné.
              </p>
            ) : (
              <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
                {derniersDevoirs.map((d, i) => (
                  <li key={i} className="px-4 py-2.5">
                    <p className="font-medium text-white">{d.titre}</p>
                    <p className="text-sm text-slate-400">
                      {d.affectation?.matiere?.nom ?? "—"}
                      {d.affectation?.classe ? ` · ${d.affectation.classe.nom}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
