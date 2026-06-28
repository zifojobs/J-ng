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
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Professeurs</h1>
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

      {/* Formulaire d'ajout d'un professeur */}
      <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Ajouter un professeur
        </h2>
        <form action={ajouterProfesseur} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Prénom</label>
              <input
                name="prenom"
                required
                placeholder="Awa"
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Nom</label>
              <input
                name="nom"
                required
                placeholder="Ndiaye"
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="awa.ndiaye@exemple.com"
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">
                Mot de passe provisoire
              </label>
              <input
                name="password"
                type="text"
                required
                minLength={6}
                placeholder="au moins 6 caractères"
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Transmettez ce mot de passe au professeur ; il pourra le changer plus tard.
          </p>
          <div>
            <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
              Ajouter le professeur
            </button>
          </div>
        </form>
      </section>

      {/* Liste des professeurs */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Professeurs ({professeurs?.length ?? 0})
        </h2>
        {professeurs && professeurs.length > 0 ? (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
            {professeurs.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">
                    {p.prenom} {p.nom}
                  </p>
                  <p className="text-sm text-slate-400">{p.email}</p>
                </div>
                <form action={supprimerProfesseur}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10">
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            Aucun professeur pour l&apos;instant. Ajoutez-en un ci-dessus.
          </p>
        )}
      </section>
    </div></main>
  );
}
