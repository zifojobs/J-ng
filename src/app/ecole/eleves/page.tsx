import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ajouterEleve, supprimerEleve } from "./actions";

type Classe = {
  id: string;
  nom: string;
  annees_scolaires: { libelle: string } | null;
};

type Eleve = {
  id: string;
  prenom: string;
  nom: string;
  identifiant: string | null;
};

export default async function ElevesPage({
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

  // Toutes les classes de l'école, avec le libellé de leur année (RLS = sa propre école).
  const { data: classes } = await supabase
    .from("classes")
    .select("id, nom, annees_scolaires ( libelle )")
    .order("nom", { ascending: true })
    .returns<Classe[]>();

  // Aucune classe : il faut en créer une avant d'inscrire des élèves.
  if (!classes || classes.length === 0) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
          <Link
            href="/ecole"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            ← Retour
          </Link>
        </header>
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Vous devez d&apos;abord créer une classe avant d&apos;inscrire des élèves.{" "}
          <Link href="/ecole/classes" className="font-medium underline">
            Gérer les classes
          </Link>
        </p>
      </main>
    );
  }

  // Classe choisie : celle de l'URL, sinon la première.
  const classeChoisie = classes.find((c) => c.id === classe) ?? classes[0];

  // Les élèves de la classe choisie.
  const { data: eleves } = await supabase
    .from("profils")
    .select("id, prenom, nom, identifiant")
    .eq("role", "eleve")
    .eq("classe_id", classeChoisie.id)
    .order("nom", { ascending: true })
    .returns<Eleve[]>();

  const libelleClasse = (c: Classe) =>
    c.nom + (c.annees_scolaires ? ` (${c.annees_scolaires.libelle})` : "");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Classe</h2>
          <Link
            href={`/ecole/eleves/bulletins?classe=${classeChoisie.id}`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Bulletins de la classe
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={"/ecole/eleves?classe=" + c.id}
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

      {/* Formulaire d'inscription d'un élève dans la classe choisie */}
      <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Inscrire un élève — {libelleClasse(classeChoisie)}
        </h2>
        <form action={ajouterEleve} className="flex flex-col gap-4">
          <input type="hidden" name="classe_id" value={classeChoisie.id} />
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Prénom</label>
              <input
                name="prenom"
                required
                placeholder="Fatou"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nom</label>
              <input
                name="nom"
                required
                placeholder="Sow"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Matricule (identifiant de connexion)
              </label>
              <input
                name="matricule"
                required
                placeholder="ELV-2026-001"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Mot de passe provisoire
              </label>
              <input
                name="password"
                type="text"
                required
                minLength={6}
                placeholder="au moins 6 caractères"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            L&apos;élève se connectera avec son <strong>matricule</strong> et ce mot de
            passe (il pourra le changer plus tard).
          </p>
          <div>
            <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
              Inscrire l&apos;élève
            </button>
          </div>
        </form>
      </section>

      {/* Liste des élèves de la classe choisie */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Élèves de {libelleClasse(classeChoisie)} ({eleves?.length ?? 0})
        </h2>
        {eleves && eleves.length > 0 ? (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {eleves.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {e.prenom} {e.nom}
                  </p>
                  <p className="text-sm text-gray-500">Matricule : {e.identifiant}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/ecole/eleves/${e.id}/bulletin`}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Bulletin
                  </Link>
                  <form action={supprimerEleve}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="classe_id" value={classeChoisie.id} />
                    <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            Aucun élève dans cette classe. Inscrivez-en un ci-dessus.
          </p>
        )}
      </section>
    </main>
  );
}
