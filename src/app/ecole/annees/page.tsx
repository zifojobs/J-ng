import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ajouterAnnee, definirAnneeActive, supprimerAnnee } from "./actions";

type AnneeScolaire = {
  id: string;
  libelle: string;
  active: boolean;
};

export default async function AnneesPage({
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

  // L'admin ne voit QUE les années de son école (grâce à la RLS).
  const { data: annees } = await supabase
    .from("annees_scolaires")
    .select("id, libelle, active")
    .order("libelle", { ascending: false })
    .returns<AnneeScolaire[]>();

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Années scolaires</h1>
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

      {/* Formulaire d'ajout d'une année scolaire */}
      <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Ajouter une année scolaire
        </h2>
        <form action={ajouterAnnee} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Libellé</label>
            <input
              name="libelle"
              required
              placeholder="2025-2026"
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
            Ajouter
          </button>
        </form>
      </section>

      {/* Liste des années */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Années ({annees?.length ?? 0})
        </h2>
        {annees && annees.length > 0 ? (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
            {annees.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{a.libelle}</p>
                  {a.active ? (
                    <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-300">
                      Année en cours
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {!a.active ? (
                    <form action={definirAnneeActive}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800">
                        Rendre active
                      </button>
                    </form>
                  ) : null}
                  <form action={supprimerAnnee}>
                    <input type="hidden" name="id" value={a.id} />
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
            Aucune année scolaire pour l&apos;instant. Ajoutez-en une ci-dessus.
          </p>
        )}
      </section>
    </div></main>
  );
}
