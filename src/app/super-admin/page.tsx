import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import {
  creerEcoleEtAdmin,
  creerEcoleDepuisDemande,
  rejeterDemande,
  changerStatutEcole,
  prolongerAbonnement,
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

  // Pour repérer les échéances dépassées (AAAA-MM-JJ comparable aux dates en base).
  const aujourdhui = new Date().toLocaleDateString("fr-CA");

  // Le super-admin voit TOUTES les écoles (grâce à la RLS).
  const { data: ecoles } = await supabase
    .from("ecoles")
    .select("id, nom, slug, statut, date_echeance, created_at")
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
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Espace super-admin</h1>
          <p className="text-sm text-slate-400">
            Connecté : {profil.prenom} {profil.nom}
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800">
            Se déconnecter
          </button>
        </form>
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

      {/* Demandes d'inscription en attente */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Demandes d&apos;inscription ({demandes?.length ?? 0})
        </h2>
        {!demandes || demandes.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-800/30 px-4 py-3 text-sm text-slate-400">
            Aucune demande en attente.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {demandes.map((d) => (
              <li
                key={d.id}
                className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5"
              >
                <div className="mb-3">
                  <p className="font-semibold text-white">{d.nom_ecole}</p>
                  <p className="text-sm text-slate-400">
                    {d.contact_prenom} {d.contact_nom} · {d.contact_email}
                    {d.contact_telephone ? ` · ${d.contact_telephone}` : ""}
                    {d.ville ? ` · ${d.ville}` : ""}
                  </p>
                  {d.message ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm italic text-slate-400">
                      « {d.message} »
                    </p>
                  ) : null}
                </div>

                {/* Créer l'école à partir de cette demande */}
                <form
                  action={creerEcoleDepuisDemande}
                  className="grid gap-3 rounded-xl border border-slate-700 bg-slate-900/50 p-4 sm:grid-cols-2"
                >
                  <input type="hidden" name="demande_id" value={d.id} />
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-medium text-slate-400">
                      Nom de l&apos;école
                    </label>
                    <input
                      name="nom_ecole"
                      required
                      defaultValue={d.nom_ecole}
                      className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-400">Prénom admin</label>
                    <input
                      name="admin_prenom"
                      required
                      defaultValue={d.contact_prenom}
                      className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-400">Nom admin</label>
                    <input
                      name="admin_nom"
                      required
                      defaultValue={d.contact_nom}
                      className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-400">Email admin</label>
                    <input
                      name="admin_email"
                      type="email"
                      required
                      defaultValue={d.contact_email}
                      className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-400">
                      Mot de passe de départ
                    </label>
                    <input
                      name="admin_password"
                      type="text"
                      required
                      minLength={6}
                      placeholder="min. 6 caractères"
                      className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <div className="flex items-end gap-2 sm:col-span-2">
                    <button className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-green-400">
                      Créer l&apos;école
                    </button>
                  </div>
                </form>

                {/* Rejeter la demande */}
                <form action={rejeterDemande} className="mt-2 flex justify-end">
                  <input type="hidden" name="demande_id" value={d.id} />
                  <button className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10">
                    Rejeter
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Formulaire de création d'une école + son admin */}
      <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Créer une école
        </h2>
        <form action={creerEcoleEtAdmin} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-slate-300">
              Nom de l&apos;école
            </label>
            <input
              name="nom_ecole"
              required
              placeholder="Collège Jàng de Dakar"
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">
              Prénom de l&apos;administrateur
            </label>
            <input
              name="admin_prenom"
              required
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">
              Nom de l&apos;administrateur
            </label>
            <input
              name="admin_nom"
              required
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">
              Email de l&apos;administrateur
            </label>
            <input
              name="admin_email"
              type="email"
              required
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">
              Mot de passe de départ
            </label>
            <input
              name="admin_password"
              type="text"
              required
              minLength={6}
              placeholder="min. 6 caractères"
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="sm:col-span-2">
            <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
              Créer l&apos;école et son admin
            </button>
          </div>
        </form>
      </section>

      {/* Liste des écoles */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Écoles ({ecoles?.length ?? 0})
        </h2>
        {ecoles && ecoles.length > 0 ? (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
            {ecoles.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{e.nom}</p>
                  <p className="text-xs text-slate-500">{e.slug}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* Statut d'abonnement : essai / actif / suspendu. */}
                  <form
                    action={changerStatutEcole}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="ecole_id" value={e.id} />
                    <select
                      name="statut"
                      defaultValue={e.statut}
                      className="rounded-xl border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-100 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    >
                      <option value="essai">essai</option>
                      <option value="actif">actif</option>
                      <option value="suspendu">suspendu</option>
                    </select>
                    <button className="rounded-xl border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-800">
                      Appliquer
                    </button>
                  </form>

                  {/* Échéance + enregistrer un paiement (prolonge l'abonnement). */}
                  <p className="text-xs text-slate-500">
                    Échéance :{" "}
                    {e.date_echeance ? (
                      <span
                        className={
                          e.date_echeance < aujourdhui
                            ? "font-medium text-red-400"
                            : "font-medium text-slate-300"
                        }
                      >
                        {new Date(e.date_echeance).toLocaleDateString("fr-FR")}
                        {e.date_echeance < aujourdhui ? " (dépassée)" : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </p>
                  <form
                    action={prolongerAbonnement}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="ecole_id" value={e.id} />
                    <input
                      name="montant_fcfa"
                      type="number"
                      min={0}
                      placeholder="FCFA"
                      className="w-20 rounded-xl border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-100 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                    <select
                      name="mois"
                      defaultValue="12"
                      className="rounded-xl border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-100 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    >
                      <option value="1">+1 mois</option>
                      <option value="3">+3 mois</option>
                      <option value="6">+6 mois</option>
                      <option value="12">+12 mois</option>
                    </select>
                    <button className="rounded-xl bg-green-500 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-green-400">
                      Enregistrer paiement
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Aucune école pour l&apos;instant.</p>
        )}
      </section>
    </div></main>
  );
}
