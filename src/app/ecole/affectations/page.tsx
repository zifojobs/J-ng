import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ajouterAffectation, supprimerAffectation } from "./actions";

type Professeur = {
  id: string;
  prenom: string;
  nom: string;
};

type Matiere = {
  id: string;
  nom: string;
};

type Classe = {
  id: string;
  nom: string;
  annees_scolaires: { libelle: string } | null;
};

type Affectation = {
  id: string;
  professeur: { prenom: string; nom: string } | null;
  matiere: { nom: string } | null;
  classe: { nom: string; annees_scolaires: { libelle: string } | null } | null;
};

export default async function AffectationsPage({
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

  // Les trois ingrédients d'une affectation (RLS = sa propre école).
  const [{ data: professeurs }, { data: matieres }, { data: classes }] = await Promise.all([
    supabase
      .from("profils")
      .select("id, prenom, nom")
      .eq("role", "professeur")
      .order("nom", { ascending: true })
      .returns<Professeur[]>(),
    supabase
      .from("matieres")
      .select("id, nom")
      .order("nom", { ascending: true })
      .returns<Matiere[]>(),
    supabase
      .from("classes")
      .select("id, nom, annees_scolaires ( libelle )")
      .order("nom", { ascending: true })
      .returns<Classe[]>(),
  ]);

  // Liste des affectations existantes, avec les noms (prof / matière / classe).
  const { data: affectations } = await supabase
    .from("affectations")
    .select(
      "id, professeur:profils ( prenom, nom ), matiere:matieres ( nom ), classe:classes ( nom, annees_scolaires ( libelle ) )"
    )
    .order("created_at", { ascending: false })
    .returns<Affectation[]>();

  const libelleClasse = (c: Classe) =>
    c.nom + (c.annees_scolaires ? ` (${c.annees_scolaires.libelle})` : "");

  // Il faut au moins un prof, une matière et une classe pour pouvoir affecter.
  const pretAAffecter =
    (professeurs?.length ?? 0) > 0 &&
    (matieres?.length ?? 0) > 0 &&
    (classes?.length ?? 0) > 0;

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affectations</h1>
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

      <p className="mb-6 text-sm text-gray-500">
        Indiquez qui enseigne quoi, et dans quelle classe. Exemple : « M. Diop —
        Mathématiques — 6ème A ».
      </p>

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

      {!pretAAffecter ? (
        <p className="mb-8 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Pour créer une affectation, il faut au moins un{" "}
          <Link href="/ecole/professeurs" className="font-medium underline">
            professeur
          </Link>
          , une{" "}
          <Link href="/ecole/matieres" className="font-medium underline">
            matière
          </Link>{" "}
          et une{" "}
          <Link href="/ecole/classes" className="font-medium underline">
            classe
          </Link>
          .
        </p>
      ) : (
        /* Formulaire d'ajout d'une affectation */
        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Ajouter une affectation
          </h2>
          <form action={ajouterAffectation} className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Professeur</label>
                <select
                  name="professeur_id"
                  required
                  defaultValue=""
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                >
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {professeurs!.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.prenom} {p.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Matière</label>
                <select
                  name="matiere_id"
                  required
                  defaultValue=""
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                >
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {matieres!.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Classe</label>
                <select
                  name="classe_id"
                  required
                  defaultValue=""
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                >
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {classes!.map((c) => (
                    <option key={c.id} value={c.id}>
                      {libelleClasse(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
                Ajouter
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Liste des affectations existantes */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Affectations ({affectations?.length ?? 0})
        </h2>
        {affectations && affectations.length > 0 ? (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {affectations.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {a.professeur ? `${a.professeur.prenom} ${a.professeur.nom}` : "—"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {a.matiere?.nom ?? "—"} —{" "}
                    {a.classe
                      ? a.classe.nom +
                        (a.classe.annees_scolaires
                          ? ` (${a.classe.annees_scolaires.libelle})`
                          : "")
                      : "—"}
                  </p>
                </div>
                <form action={supprimerAffectation}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            Aucune affectation pour le moment. Ajoutez-en une ci-dessus.
          </p>
        )}
      </section>
    </main>
  );
}
