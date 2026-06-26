import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import {
  creerEcoleEtAdmin,
  creerEcoleDepuisDemande,
  rejeterDemande,
  changerStatutEcole,
} from "./actions";

type Demande = {
  id: string;
  nom_ecole: string;
  contact_prenom: string;
  contact_nom: string;
  contact_email: string;
  contact_telephone: string | null;
  ville: string | null;
  message: string | null;
  created_at: string;
};

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

  // Les demandes d'inscription en attente (formulaire public).
  const { data: demandes } = await supabase
    .from("demandes_inscription")
    .select(
      "id, nom_ecole, contact_prenom, contact_nom, contact_email, contact_telephone, ville, message, created_at"
    )
    .eq("statut", "en_attente")
    .order("created_at", { ascending: true })
    .returns<Demande[]>();

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

      {/* Demandes d'inscription en attente */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Demandes d&apos;inscription ({demandes?.length ?? 0})
        </h2>
        {!demandes || demandes.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Aucune demande en attente.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {demandes.map((d) => (
              <li
                key={d.id}
                className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5"
              >
                <div className="mb-3">
                  <p className="font-semibold text-gray-900">{d.nom_ecole}</p>
                  <p className="text-sm text-gray-600">
                    {d.contact_prenom} {d.contact_nom} · {d.contact_email}
                    {d.contact_telephone ? ` · ${d.contact_telephone}` : ""}
                    {d.ville ? ` · ${d.ville}` : ""}
                  </p>
                  {d.message ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm italic text-gray-600">
                      « {d.message} »
                    </p>
                  ) : null}
                </div>

                {/* Créer l'école à partir de cette demande */}
                <form
                  action={creerEcoleDepuisDemande}
                  className="grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-2"
                >
                  <input type="hidden" name="demande_id" value={d.id} />
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600">
                      Nom de l&apos;école
                    </label>
                    <input
                      name="nom_ecole"
                      required
                      defaultValue={d.nom_ecole}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Prénom admin</label>
                    <input
                      name="admin_prenom"
                      required
                      defaultValue={d.contact_prenom}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Nom admin</label>
                    <input
                      name="admin_nom"
                      required
                      defaultValue={d.contact_nom}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Email admin</label>
                    <input
                      name="admin_email"
                      type="email"
                      required
                      defaultValue={d.contact_email}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      Mot de passe de départ
                    </label>
                    <input
                      name="admin_password"
                      type="text"
                      required
                      minLength={6}
                      placeholder="min. 6 caractères"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                    />
                  </div>
                  <div className="flex items-end gap-2 sm:col-span-2">
                    <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
                      Créer l&apos;école
                    </button>
                  </div>
                </form>

                {/* Rejeter la demande */}
                <form action={rejeterDemande} className="mt-2 flex justify-end">
                  <input type="hidden" name="demande_id" value={d.id} />
                  <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                    Rejeter
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

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
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{e.nom}</p>
                  <p className="text-xs text-gray-500">{e.slug}</p>
                </div>

                {/* Statut d'abonnement : essai / actif / suspendu. */}
                <form
                  action={changerStatutEcole}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="ecole_id" value={e.id} />
                  <select
                    name="statut"
                    defaultValue={e.statut}
                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-900 outline-none focus:border-gray-900"
                  >
                    <option value="essai">essai</option>
                    <option value="actif">actif</option>
                    <option value="suspendu">suspendu</option>
                  </select>
                  <button className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">
                    Appliquer
                  </button>
                </form>
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
