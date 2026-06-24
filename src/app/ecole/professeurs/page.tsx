import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ajouterProfesseur, supprimerProfesseur } from "./actions";

type Professeur = {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
};

export default async function ProfesseursPage({
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

  // L'admin ne voit QUE les profs de son école (grâce à la RLS).
  const { data: professeurs } = await supabase
    .from("profils")
    .select("id, prenom, nom, email")
    .eq("role", "professeur")
    .order("nom", { ascending: true })
    .returns<Professeur[]>();

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Professeurs</h1>
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

      {/* Formulaire d'ajout d'un professeur */}
      <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Ajouter un professeur
        </h2>
        <form action={ajouterProfesseur} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Prénom</label>
              <input
                name="prenom"
                required
                placeholder="Awa"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nom</label>
              <input
                name="nom"
                required
                placeholder="Ndiaye"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="awa.ndiaye@exemple.com"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Mot de passe provisoire
              </label>
              <input
                name="password"
                type="text"
                required
                minLength={6}
                placeholder="au moins 6 caractères"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Transmettez ce mot de passe au professeur ; il pourra le changer plus tard.
          </p>
          <div>
            <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
              Ajouter le professeur
            </button>
          </div>
        </form>
      </section>

      {/* Liste des professeurs */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Professeurs ({professeurs?.length ?? 0})
        </h2>
        {professeurs && professeurs.length > 0 ? (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {professeurs.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {p.prenom} {p.nom}
                  </p>
                  <p className="text-sm text-gray-500">{p.email}</p>
                </div>
                <form action={supprimerProfesseur}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            Aucun professeur pour l&apos;instant. Ajoutez-en un ci-dessus.
          </p>
        )}
      </section>
    </main>
  );
}
