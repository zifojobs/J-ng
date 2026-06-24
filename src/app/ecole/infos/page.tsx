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
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coordonnées de l&apos;école</h1>
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

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="mb-1 text-sm text-gray-500">Votre école</p>
        <p className="mb-6 text-xl font-semibold text-gray-900">{ecole?.nom ?? "—"}</p>

        {/* Logo (facultatif) */}
        <div className="mb-8 border-b border-gray-200 pb-8">
          <p className="mb-3 text-sm font-medium text-gray-700">Logo (facultatif)</p>
          <div className="flex flex-wrap items-center gap-4">
            {ecole?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ecole.logo_url}
                alt="Logo de l'école"
                className="h-20 w-20 rounded-lg border border-gray-200 object-contain"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
                Aucun
              </div>
            )}

            <form action={enregistrerLogo} className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                name="logo"
                accept="image/*"
                required
                className="text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-white hover:file:bg-gray-800"
              />
              <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
                Envoyer
              </button>
            </form>

            {ecole?.logo_url ? (
              <form action={supprimerLogo}>
                <button className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  Retirer
                </button>
              </form>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-gray-500">Image PNG ou JPG, 2 Mo maximum.</p>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          Ces informations apparaîtront en en-tête et en pied du bulletin de l&apos;élève.
          Tous les champs sont facultatifs.
        </p>

        <form action={enregistrerCoordonnees} className="grid gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Adresse</label>
            <input
              name="adresse"
              defaultValue={ecole?.adresse ?? ""}
              placeholder="Rue 10 x Avenue Bourguiba, Dakar"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Téléphone</label>
            <input
              name="telephone"
              defaultValue={ecole?.telephone ?? ""}
              placeholder="+221 33 800 00 00"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Responsable (signataire du bulletin)
            </label>
            <input
              name="directeur"
              defaultValue={ecole?.directeur ?? ""}
              placeholder="M. Diop, Directeur"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
            <p className="text-xs text-gray-500">
              Affiché au-dessus de la zone de signature/cachet, en bas du bulletin.
            </p>
          </div>

          <div>
            <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
              Enregistrer
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
