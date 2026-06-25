import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ajouterNote, supprimerNote } from "../actions";

type Affectation = {
  id: string;
  classe_id: string;
  matiere: { nom: string } | null;
  classe: { nom: string; annees_scolaires: { libelle: string } | null } | null;
};

type Eleve = {
  id: string;
  prenom: string;
  nom: string;
};

type Note = {
  id: string;
  type: string;
  semestre: number;
  titre: string | null;
  valeur: number;
  coefficient: number;
  date_evaluation: string;
  eleve: { prenom: string; nom: string } | null;
};

export default async function SaisieNotesPage({
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

  // L'affectation doit appartenir à CE prof (sinon : pas le droit d'y saisir).
  const { data: affectation } = await supabase
    .from("affectations")
    .select(
      "id, classe_id, matiere:matieres ( nom ), classe:classes ( nom, annees_scolaires ( libelle ) )"
    )
    .eq("id", affectationId)
    .eq("professeur_id", profil.id)
    .single<Affectation>();

  if (!affectation) {
    redirect("/espace/notes");
  }

  // Les élèves de la classe de cette affectation.
  const { data: eleves } = await supabase
    .from("profils")
    .select("id, prenom, nom")
    .eq("role", "eleve")
    .eq("classe_id", affectation.classe_id)
    .order("nom", { ascending: true })
    .returns<Eleve[]>();

  // Les notes déjà saisies pour cette affectation.
  const { data: notes } = await supabase
    .from("notes")
    .select(
      "id, type, semestre, titre, valeur, coefficient, date_evaluation, eleve:profils ( prenom, nom )"
    )
    .eq("affectation_id", affectationId)
    .order("semestre", { ascending: true })
    .order("date_evaluation", { ascending: false })
    .returns<Note[]>();

  // On sépare les notes par semestre pour les afficher en deux groupes.
  const notesParSemestre = [1, 2].map((s) => ({
    semestre: s,
    liste: (notes ?? []).filter((n) => n.semestre === s),
  }));

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
          href="/espace/notes"
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

      {!eleves || eleves.length === 0 ? (
        <p className="mb-8 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucun élève dans cette classe pour le moment.
        </p>
      ) : (
        /* Formulaire de saisie d'une note */
        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Ajouter une note</h2>
          <form action={ajouterNote} className="flex flex-col gap-4">
            <input type="hidden" name="affectation_id" value={affectation.id} />

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Élève</label>
                <select
                  name="eleve_id"
                  required
                  defaultValue=""
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                >
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {eleves.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.prenom} {e.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Type</label>
                <select
                  name="type"
                  required
                  defaultValue="devoir"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                >
                  <option value="devoir">Devoir</option>
                  <option value="composition">Composition</option>
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Semestre</label>
                <select
                  name="semestre"
                  required
                  defaultValue="1"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                >
                  <option value="1">1ᵉʳ semestre</option>
                  <option value="2">2ᵉ semestre</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Titre (facultatif)
                </label>
                <input
                  name="titre"
                  placeholder="Devoir 1"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Note / 20</label>
                <input
                  name="valeur"
                  required
                  inputMode="decimal"
                  placeholder="14"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <input
                  name="date_evaluation"
                  type="date"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>
              <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
                Enregistrer
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Liste des notes saisies, regroupées par semestre */}
      <section className="flex flex-col gap-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Notes saisies ({notes?.length ?? 0})
        </h2>
        {!notes || notes.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucune note pour l&apos;instant. Ajoutez-en une ci-dessus.
          </p>
        ) : (
          notesParSemestre.map(({ semestre, liste }) => (
            <div key={semestre}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {semestre === 1 ? "1ᵉʳ semestre" : "2ᵉ semestre"} ({liste.length})
              </h3>
              {liste.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune note.</p>
              ) : (
                <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {liste.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {n.eleve ? `${n.eleve.prenom} ${n.eleve.nom}` : "—"} —{" "}
                          <span className="text-gray-900">{n.valeur}/20</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {n.type === "composition" ? "Composition" : "Devoir"}
                          {n.titre ? ` « ${n.titre} »` : ""} · {n.date_evaluation}
                        </p>
                      </div>
                      <form action={supprimerNote}>
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="affectation_id" value={affectation.id} />
                        <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                          Supprimer
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}
