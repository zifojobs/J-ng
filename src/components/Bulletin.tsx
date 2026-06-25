import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BoutonImprimer } from "@/components/BoutonImprimer";

// Composant réutilisable : affiche le bulletin imprimable d'UN élève (par son id).
// La sécurité (qui a le droit de voir quoi) est garantie par la base (RLS) et
// vérifiée dans chaque page qui appelle ce composant ; ici on ne fait qu'afficher.

type Note = {
  id: string;
  type: string;
  titre: string | null;
  valeur: number;
  coefficient: number;
  date_evaluation: string;
  affectation: { matiere: { nom: string; coefficient_defaut: number } | null } | null;
};

type EleveProfil = {
  prenom: string;
  nom: string;
  classe: { nom: string; annees_scolaires: { libelle: string } | null } | null;
};

// Moyenne pondérée par les coefficients (ou null si aucune note).
function moyenne(notes: Note[]): number | null {
  if (notes.length === 0) return null;
  const sommeCoef = notes.reduce((s, n) => s + Number(n.coefficient), 0);
  if (sommeCoef === 0) return null;
  const sommePoints = notes.reduce((s, n) => s + Number(n.valeur) * Number(n.coefficient), 0);
  return sommePoints / sommeCoef;
}

// Appréciation générale automatique selon la moyenne générale /20.
function mention(moy: number | null): string {
  if (moy === null) return "—";
  if (moy >= 16) return "Excellent — Félicitations";
  if (moy >= 14) return "Très bien";
  if (moy >= 12) return "Bien";
  if (moy >= 10) return "Assez bien";
  return "Insuffisant";
}

export async function Bulletin({
  supabase,
  eleveId,
  retourHref,
  semestre,
  bulletinHref,
}: {
  supabase: SupabaseClient;
  eleveId: string;
  retourHref: string;
  // Semestre affiché (1 ou 2) et adresse de cette page de bulletin (pour les
  // liens du sélecteur de semestre).
  semestre: 1 | 2;
  bulletinHref: string;
}) {
  // École + identité de l'élève (avec sa classe et l'année) + ses notes DU
  // semestre choisi.
  const [{ data: ecole }, { data: eleve }, { data: notes }] = await Promise.all([
    supabase.from("ecoles").select("nom, adresse, telephone, directeur, logo_url").single(),
    supabase
      .from("profils")
      .select("prenom, nom, classe:classes ( nom, annees_scolaires ( libelle ) )")
      .eq("id", eleveId)
      .single<EleveProfil>(),
    supabase
      .from("notes")
      .select(
        "id, type, titre, valeur, coefficient, date_evaluation, affectation:affectations ( matiere:matieres ( nom, coefficient_defaut ) )"
      )
      .eq("eleve_id", eleveId)
      .eq("semestre", semestre)
      .order("date_evaluation", { ascending: false })
      .returns<Note[]>(),
  ]);

  const libelleSemestre = semestre === 1 ? "1ᵉʳ semestre" : "2ᵉ semestre";

  // Regrouper les notes par matière (on garde aussi le coefficient de la matière).
  const parMatiere = new Map<string, { coef: number; notes: Note[] }>();
  for (const n of notes ?? []) {
    const nom = n.affectation?.matiere?.nom ?? "Autres";
    const coef = Number(n.affectation?.matiere?.coefficient_defaut ?? 1);
    const entree = parMatiere.get(nom) ?? { coef, notes: [] };
    entree.notes.push(n);
    parMatiere.set(nom, entree);
  }

  // Pour chaque matière : moyenne /20, coefficient, et points = moyenne × coef.
  const lignes = [...parMatiere.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([nom, { coef, notes: liste }]) => {
      const moy = moyenne(liste);
      return {
        nom,
        notes: liste,
        coef,
        moyenne: moy,
        points: moy === null ? null : moy * coef,
      };
    });

  // Moyenne générale = somme des (moyenne × coef) ÷ somme des coefficients,
  // en ne comptant que les matières qui ont au moins une note.
  const lignesNotees = lignes.filter((l) => l.moyenne !== null);
  const totalCoef = lignesNotees.reduce((s, l) => s + l.coef, 0);
  const totalPoints = lignesNotees.reduce((s, l) => s + (l.points ?? 0), 0);
  const moyenneGenerale = totalCoef > 0 ? totalPoints / totalCoef : null;

  // Rang dans la classe + moyennes de la classe (calculés par la fonction SQL
  // sécurisée : elle ne renvoie que des chiffres agrégés, jamais les notes des
  // autres élèves).
  const { data: stats } = await supabase
    .rpc("stats_classe_eleve", { p_eleve_id: eleveId, p_semestre: semestre })
    .maybeSingle<{
      rang: number | null;
      effectif: number | null;
      moyenne_classe: number | null;
      moyenne_max: number | null;
      moyenne_min: number | null;
    }>();

  const rangTexte =
    stats?.rang != null && stats?.effectif != null
      ? `${stats.rang === 1 ? "1ᵉʳ" : `${stats.rang}ᵉ`} sur ${stats.effectif}`
      : null;

  const classe = eleve?.classe;
  const libelleClasse = classe
    ? classe.nom + (classe.annees_scolaires ? ` — ${classe.annees_scolaires.libelle}` : "")
    : "—";
  const dateEdition = new Date().toLocaleDateString("fr-FR");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8 print:p-0">
      {/* Barre d'actions (cachée à l'impression) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={retourHref}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Retour
        </Link>

        {/* Choix du semestre */}
        <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 text-sm">
          {([1, 2] as const).map((s) => (
            <Link
              key={s}
              href={`${bulletinHref}?semestre=${s}`}
              className={
                "px-3 py-1.5 " +
                (s === semestre
                  ? "bg-gray-900 font-medium text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100")
              }
            >
              {s === 1 ? "1ᵉʳ semestre" : "2ᵉ semestre"}
            </Link>
          ))}
        </div>

        <BoutonImprimer />
      </div>

      {/* Le bulletin imprimable */}
      <article className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 print:rounded-none print:border-0 print:p-0">
        {/* En-tête */}
        <header className="mb-6 border-b border-gray-300 pb-4 text-center">
          {ecole?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ecole.logo_url}
              alt={ecole?.nom ?? "Logo"}
              className="mx-auto mb-2 h-16 w-auto object-contain"
            />
          ) : null}
          <p className="text-lg font-bold text-gray-900">{ecole?.nom ?? "École"}</p>
          {ecole?.adresse ? (
            <p className="mt-0.5 text-xs text-gray-600">{ecole.adresse}</p>
          ) : null}
          {ecole?.telephone ? (
            <p className="text-xs text-gray-600">Tél. {ecole.telephone}</p>
          ) : null}
          <h1 className="mt-2 text-xl font-bold text-gray-900">
            Bulletin — {libelleSemestre}
          </h1>
        </header>

        {/* Identité de l'élève */}
        <section className="mb-6 grid grid-cols-2 gap-2 text-sm">
          <p className="text-gray-700">
            <span className="text-gray-500">Élève : </span>
            <span className="font-medium text-gray-900">
              {eleve?.prenom} {eleve?.nom}
            </span>
          </p>
          <p className="text-gray-700 sm:text-right">
            <span className="text-gray-500">Classe : </span>
            <span className="font-medium text-gray-900">{libelleClasse}</span>
          </p>
          <p className="text-gray-700">
            <span className="text-gray-500">Édité le : </span>
            <span className="font-medium text-gray-900">{dateEdition}</span>
          </p>
          {rangTexte ? (
            <p className="text-gray-700 sm:text-right">
              <span className="text-gray-500">Rang : </span>
              <span className="font-medium text-gray-900">{rangTexte}</span>
            </p>
          ) : null}
        </section>

        {/* Tableau des matières */}
        {lignes.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune note pour ce semestre.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-gray-300 text-left">
                <th className="py-2 font-semibold text-gray-700">Matière</th>
                <th className="py-2 text-center font-semibold text-gray-700">Détail des notes</th>
                <th className="py-2 text-right font-semibold text-gray-700">Moy. /20</th>
                <th className="py-2 text-center font-semibold text-gray-700">Coef</th>
                <th className="py-2 text-right font-semibold text-gray-700">Moy. × Coef</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.nom} className="border-b border-gray-200 align-top">
                  <td className="py-2 font-medium text-gray-900">{l.nom}</td>
                  <td className="py-2 text-center text-gray-600">
                    {l.notes.map((n) => `${n.valeur}`).join(" · ")}
                  </td>
                  <td className="py-2 text-right font-semibold text-gray-900">
                    {l.moyenne !== null ? l.moyenne.toFixed(2) : "—"}
                  </td>
                  <td className="py-2 text-center text-gray-700">{l.coef}</td>
                  <td className="py-2 text-right font-semibold text-gray-900">
                    {l.points !== null ? `${l.points.toFixed(2)} / ${20 * l.coef}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {/* Totaux : somme des points sur le maximum possible. */}
              <tr className="border-t-2 border-gray-400">
                <td className="py-2 font-semibold text-gray-900" colSpan={3}>
                  Total
                </td>
                <td className="py-2 text-center font-semibold text-gray-900">{totalCoef}</td>
                <td className="py-2 text-right font-semibold text-gray-900">
                  {totalPoints.toFixed(2)} / {20 * totalCoef}
                </td>
              </tr>
              {/* Moyenne générale = total des points ÷ total des coefficients. */}
              <tr>
                <td className="py-2 text-lg font-bold text-gray-900" colSpan={4}>
                  Moyenne générale /20
                </td>
                <td className="py-2 text-right text-lg font-bold text-gray-900">
                  {moyenneGenerale !== null ? moyenneGenerale.toFixed(2) : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Stats de la classe + appréciation générale */}
        {lignes.length > 0 ? (
          <section className="mt-6 space-y-1 rounded-lg bg-gray-50 px-4 py-3 text-sm print:bg-transparent print:px-0">
            {stats?.moyenne_classe != null ? (
              <p className="text-gray-700">
                <span className="text-gray-500">Moyenne de la classe : </span>
                <span className="font-medium text-gray-900">{stats.moyenne_classe}</span>
                {stats.moyenne_max != null && stats.moyenne_min != null ? (
                  <span className="text-gray-500">
                    {" "}· plus forte {stats.moyenne_max} · plus faible {stats.moyenne_min}
                  </span>
                ) : null}
              </p>
            ) : null}
            <p>
              <span className="text-gray-500">Appréciation générale : </span>
              <span className="font-semibold text-gray-900">{mention(moyenneGenerale)}</span>
            </p>
          </section>
        ) : null}

        {/* Zone de signature / cachet du responsable (à droite, classique) */}
        <section className="mt-10 flex justify-end">
          <div className="w-56 text-center">
            <p className="text-sm font-medium text-gray-900">
              {ecole?.directeur ?? "Le responsable de l'école"}
            </p>
            <p className="mt-1 text-xs text-gray-500">Signature et cachet</p>
            <div className="mt-16 border-t border-gray-400" />
          </div>
        </section>

        <footer className="mt-10 hidden justify-between text-xs text-gray-500 print:flex">
          <span>{ecole?.nom ?? "École"}</span>
          <span>Document généré le {dateEdition}</span>
        </footer>
      </article>
    </main>
  );
}
