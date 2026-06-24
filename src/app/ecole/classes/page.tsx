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
      <main className="mx-auto max-w-3xl p-4 sm:p-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <Link
            href="/ecole"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            ← Retour
          </Link>
        </header>
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Vous devez d&apos;abord créer une année scolaire avant d&apos;ajouter des
          classes.{" "}
          <Link href="/ecole/annees" className="font-medium underline">
            Gérer les années scolaires
          </Link>
        </p>
      </main>
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
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
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

      {/* Choix de l'année scolaire à gérer */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Année scolaire</h2>
        <div className="flex flex-wrap gap-2">
          {annees.map((a) => (
            <Link
              key={a.id}
              href={"/ecole/classes?annee=" + a.id}
              className={
                "rounded-lg border px-3 py-1.5 text-sm " +
                (a.id === anneeChoisie.id
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100")
              }
            >
              {a.libelle}
              {a.active ? " • en cours" : ""}
            </Link>
          ))}
        </div>
      </section>

      {/* Formulaire d'ajout d'une classe pour l'année choisie */}
      <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Ajouter une classe — {anneeChoisie.libelle}
        </h2>
        <form action={ajouterClasse} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <input type="hidden" name="annee_scolaire_id" value={anneeChoisie.id} />
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nom de la classe</label>
            <input
              name="nom"
              required
              placeholder="6ème A"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>
          <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
            Ajouter
          </button>
        </form>
      </section>

      {/* Liste des classes de l'année choisie */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Classes de {anneeChoisie.libelle} ({classes?.length ?? 0})
        </h2>
        {classes && classes.length > 0 ? (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {classes.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <p className="font-medium text-gray-900">{c.nom}</p>
                <form action={supprimerClasse}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="annee_scolaire_id" value={anneeChoisie.id} />
                  <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            Aucune classe pour cette année. Ajoutez-en une ci-dessus.
          </p>
        )}
      </section>
    </main>
  );
}
