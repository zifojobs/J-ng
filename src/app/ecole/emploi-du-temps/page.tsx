import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ajouterCreneau, supprimerCreneau } from "./actions";

type Classe = {
  id: string;
  nom: string;
  annees_scolaires: { libelle: string } | null;
};

type Affectation = {
  id: string;
  professeur: { prenom: string; nom: string } | null;
  matiere: { nom: string } | null;
};

type Creneau = {
  id: string;
  jour: number;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  affectation: {
    matiere: { nom: string } | null;
    professeur: { prenom: string; nom: string } | null;
  } | null;
};

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

// hh:mm:ss -> hh:mm (Postgres renvoie l'heure avec les secondes).
const courteHeure = (h: string) => h.slice(0, 5);

export default async function EmploiDuTempsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; erreur?: string; succes?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé à l'administrateur d'école.
  if (profil.role !== "admin_ecole") {
    redirect("/");
  }

  const { classe, erreur, succes } = await searchParams;

  // Toutes les classes de l'école.
  const { data: classes } = await supabase
    .from("classes")
    .select("id, nom, annees_scolaires ( libelle )")
    .order("nom", { ascending: true })
    .returns<Classe[]>();

  const libelleClasse = (c: Classe) =>
    c.nom + (c.annees_scolaires ? ` (${c.annees_scolaires.libelle})` : "");

  if (!classes || classes.length === 0) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Emploi du temps</h1>
          <Link
            href="/ecole"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            ← Retour
          </Link>
        </header>
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Vous devez d&apos;abord créer une{" "}
          <Link href="/ecole/classes" className="font-medium underline">
            classe
          </Link>
          .
        </p>
      </main>
    );
  }

  // Classe choisie : celle de l'URL, sinon la première.
  const classeChoisie = classes.find((c) => c.id === classe) ?? classes[0];

  // Les affectations de cette classe (les "matières enseignées" à placer).
  const { data: affectations } = await supabase
    .from("affectations")
    .select("id, professeur:profils ( prenom, nom ), matiere:matieres ( nom )")
    .eq("classe_id", classeChoisie.id)
    .returns<Affectation[]>();

  // Les créneaux déjà posés pour cette classe (via ses affectations).
  const affIds = (affectations ?? []).map((a) => a.id);
  let creneaux: Creneau[] = [];
  if (affIds.length > 0) {
    const { data } = await supabase
      .from("creneaux")
      .select(
        "id, jour, heure_debut, heure_fin, salle, affectation:affectations ( matiere:matieres ( nom ), professeur:profils ( prenom, nom ) )"
      )
      .in("affectation_id", affIds)
      .order("jour", { ascending: true })
      .order("heure_debut", { ascending: true })
      .returns<Creneau[]>();
    creneaux = data ?? [];
  }

  // Regrouper les créneaux par jour (1..6) pour l'affichage.
  const parJour = JOURS.map((nom, i) => ({
    jour: i + 1,
    nom,
    liste: creneaux.filter((c) => c.jour === i + 1),
  }));

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emploi du temps</h1>
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

      {/* Choix de la classe */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Classe</h2>
        <div className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={"/ecole/emploi-du-temps?classe=" + c.id}
              className={
                "rounded-lg border px-3 py-1.5 text-sm " +
                (c.id === classeChoisie.id
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100")
              }
            >
              {libelleClasse(c)}
            </Link>
          ))}
        </div>
      </section>

      {!affectations || affectations.length === 0 ? (
        <p className="mb-8 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucune matière n&apos;est encore affectée à cette classe. Créez d&apos;abord des{" "}
          <Link href="/ecole/affectations" className="font-medium underline">
            affectations
          </Link>{" "}
          (prof + matière + classe).
        </p>
      ) : (
        /* Formulaire d'ajout d'un créneau */
        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Ajouter un créneau — {libelleClasse(classeChoisie)}
          </h2>
          <form action={ajouterCreneau} className="flex flex-col gap-4">
            <input type="hidden" name="classe_id" value={classeChoisie.id} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Matière (professeur)</label>
              <select
                name="affectation_id"
                required
                defaultValue=""
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              >
                <option value="" disabled>
                  Choisir…
                </option>
                {affectations.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.matiere?.nom ?? "—"}
                    {a.professeur ? ` — ${a.professeur.prenom} ${a.professeur.nom}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Jour</label>
                <select
                  name="jour"
                  required
                  defaultValue="1"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                >
                  {JOURS.map((nom, i) => (
                    <option key={nom} value={i + 1}>
                      {nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Début</label>
                <input
                  name="heure_debut"
                  type="time"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Fin</label>
                <input
                  name="heure_fin"
                  type="time"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Salle (facultatif)</label>
                <input
                  name="salle"
                  placeholder="Salle 4"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>
              <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
                Ajouter
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Emploi du temps de la classe, jour par jour */}
      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Emploi du temps — {libelleClasse(classeChoisie)}
        </h2>
        {creneaux.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun créneau pour le moment.</p>
        ) : (
          parJour
            .filter((j) => j.liste.length > 0)
            .map((j) => (
              <div key={j.jour}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {j.nom}
                </h3>
                <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {j.liste.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {courteHeure(c.heure_debut)}–{courteHeure(c.heure_fin)} ·{" "}
                          {c.affectation?.matiere?.nom ?? "—"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {c.affectation?.professeur
                            ? `${c.affectation.professeur.prenom} ${c.affectation.professeur.nom}`
                            : "—"}
                          {c.salle ? ` · ${c.salle}` : ""}
                        </p>
                      </div>
                      <form action={supprimerCreneau}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="classe_id" value={classeChoisie.id} />
                        <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                          Supprimer
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            ))
        )}
      </section>
    </main>
  );
}
