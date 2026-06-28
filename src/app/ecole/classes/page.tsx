import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ajouterClasse, supprimerClasse } from "./actions";

type AnneeScolaire = {
  id: string;
  libelle: string;
  active: boolean;
};

type Classe = {
  id: string;
  nom: string;
};

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ annee?: string; erreur?: string; succes?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé à l'administrateur d'école.
  if (profil.role !== "admin_ecole") {
    redirect("/");
  }

  const { annee, erreur, succes } = await searchParams;

  // L'admin ne voit QUE les années de son école (grâce à la RLS).
  const { data: annees } = await supabase
    .from("annees_scolaires")
    .select("id, libelle, active")
    .order("libelle", { ascending: false })
    .returns<AnneeScolaire[]>();

  // Aucune année : il faut en créer une avant de gérer des classes.
  if (!annees || annees.length === 0) {
    return (
      <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Classes</h1>
          <Link
            href="/ecole"
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Retour
          </Link>
        </header>
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Vous devez d&apos;abord créer une année scolaire avant d&apos;ajouter des
          classes.{" "}
          <Link href="/ecole/annees" className="font-medium underline">
            Gérer les années scolaires
          </Link>
        </p>
      </div></main>
    );
  }

  // Année choisie : celle de l'URL, sinon l'année active, sinon la première.
  const anneeChoisie =
    annees.find((a) => a.id === annee) ??
    annees.find((a) => a.active) ??
    annees[0];

  // Les classes de l'année choisie (RLS limite déjà à l'école de l'admin).
  const { data: classes } = await supabase
    .from("classes")
    .select("id, nom")
    .eq("annee_scolaire_id", anneeChoisie.id)
    .order("nom", { ascending: true })
    .returns<Classe[]>();

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Classes</h1>
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

      {/* Choix de l'année scolaire à gérer */}
      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Année scolaire</h2>
        <div className="flex flex-wrap gap-2">
          {annees.map((a) => (
            <Link
              key={a.id}
              href={"/ecole/classes?annee=" + a.id}
              className={
                "rounded-lg border px-3 py-1.5 text-sm " +
                (a.id === anneeChoisie.id
                  ? "border-green-500 bg-green-500 text-slate-900"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800")
              }
            >
              {a.libelle}
              {a.active ? " • en cours" : ""}
            </Link>
          ))}
        </div>
      </section>

      {/* Formulaire d'ajout d'une classe pour l'année choisie */}
      <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Ajouter une classe — {anneeChoisie.libelle}
        </h2>
        <form action={ajouterClasse} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <input type="hidden" name="annee_scolaire_id" value={anneeChoisie.id} />
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Nom de la classe</label>
            <input
              name="nom"
              required
              placeholder="6ème A"
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
            Ajouter
          </button>
        </form>
      </section>

      {/* Liste des classes de l'année choisie */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Classes de {anneeChoisie.libelle} ({classes?.length ?? 0})
        </h2>
        {classes && classes.length > 0 ? (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
            {classes.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <p className="font-medium text-white">{c.nom}</p>
                <form action={supprimerClasse}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="annee_scolaire_id" value={anneeChoisie.id} />
                  <button className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10">
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            Aucune classe pour cette année. Ajoutez-en une ci-dessus.
          </p>
        )}
      </section>
    </div></main>
  );
}
