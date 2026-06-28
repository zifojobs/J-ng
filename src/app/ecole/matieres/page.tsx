import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ajouterMatiere, modifierCoefficient, supprimerMatiere } from "./actions";

type Matiere = {
  id: string;
  nom: string;
  code: string | null;
  coefficient_defaut: number;
};

export default async function MatieresPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; succes?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé à l'administrateur d'école.
  if (profil.role !== "admin_ecole") {
    redirect("/");
  }

  const { erreur, succes } = await searchParams;

  // L'admin ne voit QUE les matières de son école (grâce à la RLS).
  const { data: matieres } = await supabase
    .from("matieres")
    .select("id, nom, code, coefficient_defaut")
    .order("nom", { ascending: true })
    .returns<Matiere[]>();

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Matières</h1>
          <p className="text-sm text-slate-400">
            {profil.prenom} {profil.nom} — Administrateur
          </p>
        </div>
        <Link
          href="/ecole"
          className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          ← Retour
        </Link>
      </header>

      {succes ? (
        <p className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          {succes}
        </p>
      ) : null}
      {erreur ? (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {erreur}
        </p>
      ) : null}

      {/* Formulaire d'ajout d'une matière */}
      <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Ajouter une matière
        </h2>
        <form action={ajouterMatiere} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-slate-300">Nom</label>
            <input
              name="nom"
              required
              placeholder="Mathématiques"
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">
              Code (facultatif)
            </label>
            <input
              name="code"
              placeholder="MATH"
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">
              Coefficient par défaut
            </label>
            <input
              name="coefficient_defaut"
              type="number"
              step="0.5"
              min="0.5"
              defaultValue="1"
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="sm:col-span-2">
            <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
              Ajouter la matière
            </button>
          </div>
        </form>
      </section>

      {/* Liste des matières */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Matières ({matieres?.length ?? 0})
        </h2>
        {matieres && matieres.length > 0 ? (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
            {matieres.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{m.nom}</p>
                  <p className="text-xs text-slate-500">{m.code ? m.code : "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Modifier le coefficient de la matière */}
                  <form action={modifierCoefficient} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={m.id} />
                    <label className="text-sm text-slate-400">Coef.</label>
                    <input
                      name="coefficient_defaut"
                      type="number"
                      step="0.5"
                      min="0.5"
                      defaultValue={m.coefficient_defaut}
                      className="w-16 rounded-xl border border-slate-700 bg-slate-800/60 px-2 py-1 text-sm text-slate-100 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                    <button className="rounded-xl border border-slate-700 px-2 py-1 text-sm text-slate-300 transition hover:bg-slate-800">
                      Modifier
                    </button>
                  </form>
                  <form action={supprimerMatiere}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            Aucune matière pour l&apos;instant. Ajoutez-en une ci-dessus.
          </p>
        )}
      </section>
    </div></main>
  );
}
