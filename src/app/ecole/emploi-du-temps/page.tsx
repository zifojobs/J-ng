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
      <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Emploi du temps</h1>
          <Link
            href="/ecole"
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Retour
          </Link>
        </header>
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Vous devez d&apos;abord créer une{" "}
          <Link href="/ecole/classes" className="font-medium underline">
            classe
          </Link>
          .
        </p>
      </div></main>
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
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Emploi du temps</h1>
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

      {/* Choix de la classe */}
      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Classe</h2>
        <div className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={"/ecole/emploi-du-temps?classe=" + c.id}
              className={
                "rounded-lg border px-3 py-1.5 text-sm " +
                (c.id === classeChoisie.id
                  ? "border-green-500 bg-green-500 text-slate-900"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800")
              }
            >
              {libelleClasse(c)}
            </Link>
          ))}
        </div>
      </section>

      {!affectations || affectations.length === 0 ? (
        <p className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Aucune matière n&apos;est encore affectée à cette classe. Créez d&apos;abord des{" "}
          <Link href="/ecole/affectations" className="font-medium underline">
            affectations
          </Link>{" "}
          (prof + matière + classe).
        </p>
      ) : (
        /* Formulaire d'ajout d'un créneau */
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Ajouter un créneau — {libelleClasse(classeChoisie)}
          </h2>
          <form action={ajouterCreneau} className="flex flex-col gap-4">
            <input type="hidden" name="classe_id" value={classeChoisie.id} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Matière (professeur)</label>
              <select
                name="affectation_id"
                required
                defaultValue=""
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
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
                <label className="text-sm font-medium text-slate-300">Jour</label>
                <select
                  name="jour"
                  required
                  defaultValue="1"
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  {JOURS.map((nom, i) => (
                    <option key={nom} value={i + 1}>
                      {nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">Début</label>
                <input
                  name="heure_debut"
                  type="time"
                  required
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">Fin</label>
                <input
                  name="heure_fin"
                  type="time"
                  required
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">Salle (facultatif)</label>
                <input
                  name="salle"
                  placeholder="Salle 4"
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
                Ajouter
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Emploi du temps de la classe, jour par jour */}
      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-white">
          Emploi du temps — {libelleClasse(classeChoisie)}
        </h2>
        {creneaux.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun créneau pour le moment.</p>
        ) : (
          parJour
            .filter((j) => j.liste.length > 0)
            .map((j) => (
              <div key={j.jour}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {j.nom}
                </h3>
                <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
                  {j.liste.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {courteHeure(c.heure_debut)}–{courteHeure(c.heure_fin)} ·{" "}
                          {c.affectation?.matiere?.nom ?? "—"}
                        </p>
                        <p className="text-sm text-slate-400">
                          {c.affectation?.professeur
                            ? `${c.affectation.professeur.prenom} ${c.affectation.professeur.nom}`
                            : "—"}
                          {c.salle ? ` · ${c.salle}` : ""}
                        </p>
                      </div>
                      <form action={supprimerCreneau}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="classe_id" value={classeChoisie.id} />
                        <button className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10">
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
    </div></main>
  );
}
