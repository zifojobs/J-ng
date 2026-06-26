import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ajouterDevoir, supprimerDevoir } from "../actions";

type Affectation = {
  id: string;
  classe_id: string;
  matiere: { nom: string } | null;
  classe: { nom: string; annees_scolaires: { libelle: string } | null } | null;
};

type Devoir = {
  id: string;
  titre: string;
  consigne: string | null;
  date_pour_le: string | null;
  created_at: string;
};

// Affiche une date « 2026-06-30 » sous forme « 30/06/2026 » (vide si absente).
function dateLisible(iso: string | null): string {
  if (!iso) return "";
  const [a, m, j] = iso.split("-");
  return j && m && a ? `${j}/${m}/${a}` : iso;
}

export default async function DevoirsAffectationPage({
  params,
  searchParams,
}: {
  params: Promise<{ affectationId: string }>;
  searchParams: Promise<{ erreur?: string; succes?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé aux professeurs.
  if (profil.role !== "professeur") {
    redirect("/");
  }

  const { affectationId } = await params;
  const { erreur, succes } = await searchParams;

  // L'affectation doit appartenir à CE prof (sinon : pas le droit d'y écrire).
  const { data: affectation } = await supabase
    .from("affectations")
    .select(
      "id, classe_id, matiere:matieres ( nom ), classe:classes ( nom, annees_scolaires ( libelle ) )"
    )
    .eq("id", affectationId)
    .eq("professeur_id", profil.id)
    .single<Affectation>();

  if (!affectation) {
    redirect("/espace/devoirs");
  }

  // Les devoirs déjà donnés pour cette affectation (le plus proche en premier).
  const { data: devoirs } = await supabase
    .from("devoirs")
    .select("id, titre, consigne, date_pour_le, created_at")
    .eq("affectation_id", affectationId)
    .order("date_pour_le", { ascending: true, nullsFirst: false })
    .returns<Devoir[]>();

  const titreAffectation =
    (affectation.matiere?.nom ?? "—") +
    " — " +
    (affectation.classe
      ? affectation.classe.nom +
        (affectation.classe.annees_scolaires
          ? ` (${affectation.classe.annees_scolaires.libelle})`
          : "")
      : "—");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{titreAffectation}</h1>
          <p className="text-sm text-gray-500">
            {profil.prenom} {profil.nom} — Professeur
          </p>
        </div>
        <Link
          href="/espace/devoirs"
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

      {/* Formulaire de création d'un devoir */}
      <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Donner un devoir</h2>
        <form action={ajouterDevoir} className="flex flex-col gap-4">
          <input type="hidden" name="affectation_id" value={affectation.id} />

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-[2] flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Titre</label>
              <input
                name="titre"
                required
                maxLength={200}
                placeholder="Exercices p.42"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                À rendre pour le (facultatif)
              </label>
              <input
                name="date_pour_le"
                type="date"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Consigne (facultatif)
            </label>
            <textarea
              name="consigne"
              rows={3}
              maxLength={2000}
              placeholder="Détaillez le travail à faire…"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex justify-end">
            <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
              Enregistrer
            </button>
          </div>
        </form>
      </section>

      {/* Liste des devoirs donnés */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Devoirs donnés ({devoirs?.length ?? 0})
        </h2>
        {!devoirs || devoirs.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun devoir pour l&apos;instant. Ajoutez-en un ci-dessus.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {devoirs.map((d) => (
              <li
                key={d.id}
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{d.titre}</p>
                    {d.date_pour_le ? (
                      <p className="text-sm text-gray-500">
                        À rendre pour le {dateLisible(d.date_pour_le)}
                      </p>
                    ) : null}
                    {d.consigne ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {d.consigne}
                      </p>
                    ) : null}
                  </div>
                  <form action={supprimerDevoir}>
                    <input type="hidden" name="id" value={d.id} />
                    <input type="hidden" name="affectation_id" value={affectation.id} />
                    <button className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
