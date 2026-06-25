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
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matières</h1>
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

      {/* Formulaire d'ajout d'une matière */}
      <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Ajouter une matière
        </h2>
        <form action={ajouterMatiere} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Nom</label>
            <input
              name="nom"
              required
              placeholder="Mathématiques"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Code (facultatif)
            </label>
            <input
              name="code"
              placeholder="MATH"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Coefficient par défaut
            </label>
            <input
              name="coefficient_defaut"
              type="number"
              step="0.5"
              min="0.5"
              defaultValue="1"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="sm:col-span-2">
            <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
              Ajouter la matière
            </button>
          </div>
        </form>
      </section>

      {/* Liste des matières */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Matières ({matieres?.length ?? 0})
        </h2>
        {matieres && matieres.length > 0 ? (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {matieres.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{m.nom}</p>
                  <p className="text-xs text-gray-500">{m.code ? m.code : "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Modifier le coefficient de la matière */}
                  <form action={modifierCoefficient} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={m.id} />
                    <label className="text-sm text-gray-600">Coef.</label>
                    <input
                      name="coefficient_defaut"
                      type="number"
                      step="0.5"
                      min="0.5"
                      defaultValue={m.coefficient_defaut}
                      className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 outline-none focus:border-gray-900"
                    />
                    <button className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
                      Modifier
                    </button>
                  </form>
                  <form action={supprimerMatiere}>
                    <input type="hidden" name="id" value={m.id} />
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
            Aucune matière pour l&apos;instant. Ajoutez-en une ci-dessus.
          </p>
        )}
      </section>
    </main>
  );
}
