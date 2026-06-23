import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { creerEcoleEtAdmin } from "./actions";

export default async function SuperAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; succes?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Sécurité : page réservée au super-admin.
  if (profil.role !== "super_admin") {
    redirect("/");
  }

  const { erreur, succes } = await searchParams;

  // Le super-admin voit TOUTES les écoles (grâce à la RLS).
  const { data: ecoles } = await supabase
    .from("ecoles")
    .select("id, nom, slug, statut, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espace super-admin</h1>
          <p className="text-sm text-gray-500">
            Connecté : {profil.prenom} {profil.nom}
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
            Se déconnecter
          </button>
        </form>
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

      {/* Formulaire de création d'une école + son admin */}
      <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Créer une école
        </h2>
        <form action={creerEcoleEtAdmin} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Nom de l&apos;école
            </label>
            <input
              name="nom_ecole"
              required
              placeholder="Collège Jàng de Dakar"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Prénom de l&apos;administrateur
            </label>
            <input
              name="admin_prenom"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Nom de l&apos;administrateur
            </label>
            <input
              name="admin_nom"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Email de l&apos;administrateur
            </label>
            <input
              name="admin_email"
              type="email"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Mot de passe de départ
            </label>
            <input
              name="admin_password"
              type="text"
              required
              minLength={6}
              placeholder="min. 6 caractères"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="sm:col-span-2">
            <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
              Créer l&apos;école et son admin
            </button>
          </div>
        </form>
      </section>

      {/* Liste des écoles */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Écoles ({ecoles?.length ?? 0})
        </h2>
        {ecoles && ecoles.length > 0 ? (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {ecoles.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{e.nom}</p>
                  <p className="text-xs text-gray-500">{e.slug}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                  {e.statut}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Aucune école pour l&apos;instant.</p>
        )}
      </section>
    </main>
  );
}
