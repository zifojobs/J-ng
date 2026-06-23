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
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Années scolaires</h1>
          <p className="text-sm text-gray-500">
            {profil.prenom} {profil.nom} — Administrateur
          </p>
        </div>
        <Link
          href="/ecole"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Retour
        </Link>
      </header>

      {succes ? (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {succes}
        </p>
      ) : null}
      {erreur ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      ) : null}

      {/* Formulaire d'ajout d'une année scolaire */}
      <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Ajouter une année scolaire
        </h2>
        <form action={ajouterAnnee} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Libellé</label>
            <input
              name="libelle"
              required
              placeholder="2025-2026"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>
          <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
            Ajouter
          </button>
        </form>
      </section>

      {/* Liste des années */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Années ({annees?.length ?? 0})
        </h2>
        {annees && annees.length > 0 ? (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {annees.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{a.libelle}</p>
                  {a.active ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Année en cours
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {!a.active ? (
                    <form action={definirAnneeActive}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                        Rendre active
                      </button>
                    </form>
                  ) : null}
                  <form action={supprimerAnnee}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            Aucune année scolaire pour l&apos;instant. Ajoutez-en une ci-dessus.
          </p>
        )}
      </section>
    </main>
  );
}
