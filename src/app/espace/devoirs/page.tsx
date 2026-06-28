import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";

type Affectation = {
  id: string;
  matiere: { nom: string } | null;
  classe: { nom: string; annees_scolaires: { libelle: string } | null } | null;
};

export default async function DevoirsAffectationsPage() {
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
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Donner un devoir</h1>
            <p className="text-sm text-slate-400">
              {profil.prenom} {profil.nom} — Professeur
            </p>
          </div>
          <Link
            href="/espace"
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Retour
          </Link>
        </header>

        <p className="mb-6 text-sm text-slate-400">
          Choisissez la matière et la classe pour lesquelles vous voulez donner un devoir.
        </p>

        {affectations && affectations.length > 0 ? (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
            {affectations.map((a) => (
              <li key={a.id}>
                <Link
                  href={"/espace/devoirs/" + a.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-800/60"
                >
                  <span className="font-medium text-white">{libelle(a)}</span>
                  <span className="text-sm text-slate-500">›</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Vous n&apos;avez encore aucune affectation. Demandez à l&apos;administrateur de
            votre école de vous affecter à une matière et une classe.
          </p>
        )}
      </div>
    </main>
  );
}
