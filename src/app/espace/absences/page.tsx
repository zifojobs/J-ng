import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";

type Affectation = {
  id: string;
  matiere: { nom: string } | null;
  classe: { nom: string; annees_scolaires: { libelle: string } | null } | null;
};

export default async function AbsencesAffectationsPage() {
  const { supabase, profil } = await requireProfil();

  // Réservé aux professeurs.
  if (profil.role !== "professeur") {
    redirect("/");
  }

  // Les affectations de CE prof (RLS = son école ; on filtre sur lui-même).
  const { data: affectations } = await supabase
    .from("affectations")
    .select(
      "id, matiere:matieres ( nom ), classe:classes ( nom, annees_scolaires ( libelle ) )"
    )
    .eq("professeur_id", profil.id)
    .returns<Affectation[]>();

  const libelle = (a: Affectation) =>
    (a.matiere?.nom ?? "—") +
    " — " +
    (a.classe
      ? a.classe.nom +
        (a.classe.annees_scolaires ? ` (${a.classe.annees_scolaires.libelle})` : "")
      : "—");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faire l&apos;appel</h1>
          <p className="text-sm text-gray-500">
            {profil.prenom} {profil.nom} — Professeur
          </p>
        </div>
        <Link
          href="/espace"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Retour
        </Link>
      </header>

      <p className="mb-6 text-sm text-gray-500">
        Choisissez la matière et la classe pour lesquelles vous voulez faire l&apos;appel.
      </p>

      {affectations && affectations.length > 0 ? (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {affectations.map((a) => (
            <li key={a.id}>
              <Link
                href={"/espace/absences/" + a.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{libelle(a)}</span>
                <span className="text-sm text-gray-400">›</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Vous n&apos;avez encore aucune affectation. Demandez à l&apos;administrateur de
          votre école de vous affecter à une matière et une classe.
        </p>
      )}
    </main>
  );
}
