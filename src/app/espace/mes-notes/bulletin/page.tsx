import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { BoutonImprimer } from "@/components/BoutonImprimer";

type Note = {
  id: string;
  type: string;
  titre: string | null;
  valeur: number;
  coefficient: number;
  date_evaluation: string;
  affectation: { matiere: { nom: string } | null } | null;
};

type ProfilClasse = {
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

export default async function BulletinPage() {
  const { supabase, profil } = await requireProfil();

  // Réservé aux élèves.
  if (profil.role !== "eleve") {
    redirect("/");
  }

  // Identité : école + classe (avec l'année).
  const [{ data: ecole }, { data: profilClasse }, { data: notes }] = await Promise.all([
    supabase.from("ecoles").select("nom").single(),
    supabase
      .from("profils")
      .select("classe:classes ( nom, annees_scolaires ( libelle ) )")
      .eq("id", profil.id)
      .single<ProfilClasse>(),
    supabase
      .from("notes")
      .select(
        "id, type, titre, valeur, coefficient, date_evaluation, affectation:affectations ( matiere:matieres ( nom ) )"
      )
      .eq("eleve_id", profil.id)
      .order("date_evaluation", { ascending: false })
      .returns<Note[]>(),
  ]);

  // Regrouper par matière.
  const parMatiere = new Map<string, Note[]>();
  for (const n of notes ?? []) {
    const matiere = n.affectation?.matiere?.nom ?? "Autres";
    const liste = parMatiere.get(matiere) ?? [];
    liste.push(n);
    parMatiere.set(matiere, liste);
  }
  const matieres = [...parMatiere.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const moyenneGenerale = moyenne(notes ?? []);

  const classe = profilClasse?.classe;
  const libelleClasse = classe
    ? classe.nom + (classe.annees_scolaires ? ` — ${classe.annees_scolaires.libelle}` : "")
    : "—";
  const dateEdition = new Date().toLocaleDateString("fr-FR");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8 print:p-0">
      {/* Barre d'actions (cachée à l'impression) */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/espace/mes-notes"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Retour
        </Link>
        <BoutonImprimer />
      </div>

      {/* Le bulletin imprimable */}
      <article className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 print:rounded-none print:border-0 print:p-0">
        {/* En-tête */}
        <header className="mb-6 border-b border-gray-300 pb-4 text-center">
          <p className="text-lg font-bold text-gray-900">{ecole?.nom ?? "École"}</p>
          <h1 className="mt-2 text-xl font-bold text-gray-900">Bulletin de notes</h1>
        </header>

        {/* Identité de l'élève */}
        <section className="mb-6 grid grid-cols-2 gap-2 text-sm">
          <p className="text-gray-700">
            <span className="text-gray-500">Élève : </span>
            <span className="font-medium text-gray-900">
              {profil.prenom} {profil.nom}
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
        </section>

        {/* Tableau des matières */}
        {matieres.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune note pour le moment.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-gray-300 text-left">
                <th className="py-2 font-semibold text-gray-700">Matière</th>
                <th className="py-2 text-center font-semibold text-gray-700">Détail des notes</th>
                <th className="py-2 text-right font-semibold text-gray-700">Moyenne /20</th>
              </tr>
            </thead>
            <tbody>
              {matieres.map(([matiere, listeNotes]) => {
                const moy = moyenne(listeNotes);
                return (
                  <tr key={matiere} className="border-b border-gray-200 align-top">
                    <td className="py-2 font-medium text-gray-900">{matiere}</td>
                    <td className="py-2 text-center text-gray-600">
                      {listeNotes
                        .map((n) => `${n.valeur}${n.coefficient !== 1 ? ` (×${n.coefficient})` : ""}`)
                        .join(" · ")}
                    </td>
                    <td className="py-2 text-right font-semibold text-gray-900">
                      {moy !== null ? moy.toFixed(2) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-400">
                <td className="py-2 font-bold text-gray-900" colSpan={2}>
                  Moyenne générale
                </td>
                <td className="py-2 text-right text-lg font-bold text-gray-900">
                  {moyenneGenerale !== null ? moyenneGenerale.toFixed(2) : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        <footer className="mt-10 hidden justify-between text-xs text-gray-500 print:flex">
          <span>{ecole?.nom ?? "École"}</span>
          <span>Document généré le {dateEdition}</span>
        </footer>
      </article>
    </main>
  );
}
