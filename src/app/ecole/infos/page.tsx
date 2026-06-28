import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { enregistrerCoordonnees, enregistrerLogo, supprimerLogo } from "./actions";

type Ecole = {
  nom: string;
  adresse: string | null;
  telephone: string | null;
  directeur: string | null;
  logo_url: string | null;
};

export default async function InfosEcolePage({
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

  // L'admin ne voit QUE son école (grâce à la RLS).
  const { data: ecole } = await supabase
    .from("ecoles")
    .select("nom, adresse, telephone, directeur, logo_url")
    .single<Ecole>();

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Coordonnées de l&apos;école</h1>
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

      <section className="rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
        <p className="mb-1 text-sm text-slate-400">Votre école</p>
        <p className="mb-6 text-xl font-semibold text-white">{ecole?.nom ?? "—"}</p>

        {/* Logo (facultatif) */}
        <div className="mb-8 border-b border-slate-800 pb-8">
          <p className="mb-3 text-sm font-medium text-slate-300">Logo (facultatif)</p>
          <div className="flex flex-wrap items-center gap-4">
            {ecole?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ecole.logo_url}
                alt="Logo de l'école"
                className="h-20 w-20 rounded-lg border border-slate-700 object-contain"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-500">
                Aucun
              </div>
            )}

            <form action={enregistrerLogo} className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                name="logo"
                accept="image/*"
                required
                className="text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-green-500 file:px-3 file:py-2 file:text-slate-900 hover:file:bg-green-400"
              />
              <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
                Envoyer
              </button>
            </form>

            {ecole?.logo_url ? (
              <form action={supprimerLogo}>
                <button className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10">
                  Retirer
                </button>
              </form>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-slate-500">Image PNG ou JPG, 2 Mo maximum.</p>
        </div>

        <p className="mb-4 text-sm text-slate-400">
          Ces informations apparaîtront en en-tête et en pied du bulletin de l&apos;élève.
          Tous les champs sont facultatifs.
        </p>

        <form action={enregistrerCoordonnees} className="grid gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Adresse</label>
            <input
              name="adresse"
              defaultValue={ecole?.adresse ?? ""}
              placeholder="Rue 10 x Avenue Bourguiba, Dakar"
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Téléphone</label>
            <input
              name="telephone"
              defaultValue={ecole?.telephone ?? ""}
              placeholder="+221 33 800 00 00"
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">
              Responsable (signataire du bulletin)
            </label>
            <input
              name="directeur"
              defaultValue={ecole?.directeur ?? ""}
              placeholder="M. Diop, Directeur"
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
            <p className="text-xs text-slate-500">
              Affiché au-dessus de la zone de signature/cachet, en bas du bulletin.
            </p>
          </div>

          <div>
            <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
              Enregistrer
            </button>
          </div>
        </form>
      </section>
    </div></main>
  );
}
