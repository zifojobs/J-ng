import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { enregistrerAppel } from "../actions";

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

type Absence = {
  id: string;
  eleve_id: string;
  date_absence: string;
  statut: string;
  justifie: boolean;
  motif: string | null;
  eleve: { prenom: string; nom: string } | null;
};

// « 2026-06-30 » -> « 30/06/2026 ».
function dateLisible(iso: string): string {
  const [a, m, j] = iso.split("-");
  return j && m && a ? `${j}/${m}/${a}` : iso;
}

export default async function AppelPage({
  params,
  searchParams,
}: {
  params: Promise<{ affectationId: string }>;
  searchParams: Promise<{ date?: string; erreur?: string; succes?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé aux professeurs.
  if (profil.role !== "professeur") {
    redirect("/");
  }

  const { affectationId } = await params;
  const { date, erreur, succes } = await searchParams;

  // Date de l'appel : celle demandée, sinon aujourd'hui (format AAAA-MM-JJ).
  const aujourdhui = new Date().toLocaleDateString("fr-CA");
  const dateAppel = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : aujourdhui;

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
    redirect("/espace/absences");
  }

  // Les élèves de la classe de cette affectation.
  const { data: eleves } = await supabase
    .from("profils")
    .select("id, prenom, nom")
    .eq("role", "eleve")
    .eq("classe_id", affectation.classe_id)
    .order("nom", { ascending: true })
    .returns<Eleve[]>();

  // L'appel déjà saisi pour la date choisie (pour pré-remplir le formulaire).
  const { data: absencesDuJour } = await supabase
    .from("absences")
    .select("id, eleve_id, date_absence, statut, justifie, motif, eleve:profils ( prenom, nom )")
    .eq("affectation_id", affectationId)
    .eq("date_absence", dateAppel)
    .returns<Absence[]>();

  const statutDe = (eleveId: string) =>
    (absencesDuJour ?? []).find((a) => a.eleve_id === eleveId)?.statut ?? "present";

  // Tout l'historique des absences de ce cours (le plus récent d'abord).
  const { data: historique } = await supabase
    .from("absences")
    .select("id, eleve_id, date_absence, statut, justifie, motif, eleve:profils ( prenom, nom )")
    .eq("affectation_id", affectationId)
    .order("date_absence", { ascending: false })
    .returns<Absence[]>();

  // On regroupe l'historique par date.
  const parDate = new Map<string, Absence[]>();
  for (const a of historique ?? []) {
    const liste = parDate.get(a.date_absence) ?? [];
    liste.push(a);
    parDate.set(a.date_absence, liste);
  }
  const journees = [...parDate.entries()];

  const titreAffectation =
    (affectation.matiere?.nom ?? "—") +
    " — " +
    (affectation.classe
      ? affectation.classe.nom +
        (affectation.classe.annees_scolaires
          ? ` (${affectation.classe.annees_scolaires.libelle})`
          : "")
      : "—");

  const elevesIds = (eleves ?? []).map((e) => e.id).join(",");

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
          href="/espace/absences"
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

      {/* Choix de la date de l'appel (recharge la page pour pré-remplir) */}
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Date de l&apos;appel</label>
          <input
            name="date"
            type="date"
            defaultValue={dateAppel}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
          />
        </div>
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
          Changer de jour
        </button>
      </form>

      {!eleves || eleves.length === 0 ? (
        <p className="mb-8 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucun élève dans cette classe pour le moment.
        </p>
      ) : (
        /* Formulaire d'appel : un statut par élève, présents par défaut */
        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Appel du {dateLisible(dateAppel)}
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Laissez « Présent » par défaut ; ne changez que les absents et les retards.
          </p>
          <form action={enregistrerAppel} className="flex flex-col gap-3">
            <input type="hidden" name="affectation_id" value={affectation.id} />
            <input type="hidden" name="date_absence" value={dateAppel} />
            <input type="hidden" name="eleve_ids" value={elevesIds} />

            <ul className="divide-y divide-gray-200">
              {eleves.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="font-medium text-gray-900">
                    {e.prenom} {e.nom}
                  </span>
                  <select
                    name={"statut_" + e.id}
                    defaultValue={statutDe(e.id)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-900"
                  >
                    <option value="present">Présent</option>
                    <option value="absent">Absent</option>
                    <option value="retard">En retard</option>
                  </select>
                </li>
              ))}
            </ul>

            <div className="flex justify-end pt-2">
              <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
                Enregistrer l&apos;appel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Historique des appels (absents / retards enregistrés) */}
      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-gray-900">Historique</h2>
        {journees.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucune absence enregistrée pour ce cours.
          </p>
        ) : (
          journees.map(([jour, liste]) => (
            <div key={jour}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {dateLisible(jour)} ({liste.length})
              </h3>
              <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {liste.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="font-medium text-gray-900">
                      {a.eleve ? `${a.eleve.prenom} ${a.eleve.nom}` : "—"}
                    </span>
                    <span className="flex items-center gap-2 text-sm">
                      <span
                        className={
                          "rounded-lg px-2.5 py-1 font-medium " +
                          (a.statut === "absent"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-800")
                        }
                      >
                        {a.statut === "absent" ? "Absent" : "En retard"}
                      </span>
                      {a.justifie ? (
                        <span className="rounded-lg bg-green-50 px-2.5 py-1 font-medium text-green-700">
                          Justifié
                        </span>
                      ) : null}
                    </span>
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
