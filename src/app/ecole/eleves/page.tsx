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
      <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Élèves</h1>
          <Link
            href="/ecole"
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Retour
          </Link>
        </header>
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Vous devez d&apos;abord créer une classe avant d&apos;inscrire des élèves.{" "}
          <Link href="/ecole/classes" className="font-medium underline">
            Gérer les classes
          </Link>
        </p>
      </div></main>
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
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Élèves</h1>
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Classe</h2>
          <Link
            href={`/ecole/eleves/bulletins?classe=${classeChoisie.id}`}
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
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
                  ? "border-green-500 bg-green-500 text-slate-900"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800")
              }
            >
              {libelleClasse(c)}
            </Link>
          ))}
        </div>
      </section>

      {/* Formulaire d'inscription d'un élève dans la classe choisie */}
      <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Inscrire un élève — {libelleClasse(classeChoisie)}
        </h2>
        <form action={ajouterEleve} className="flex flex-col gap-4">
          <input type="hidden" name="classe_id" value={classeChoisie.id} />
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Prénom</label>
              <input
                name="prenom"
                required
                placeholder="Fatou"
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Nom</label>
              <input
                name="nom"
                required
                placeholder="Sow"
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">
                Matricule (identifiant de connexion)
              </label>
              <input
                name="matricule"
                required
                placeholder="ELV-2026-001"
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
            L&apos;élève se connectera avec son <strong>matricule</strong> et ce mot de
            passe (il pourra le changer plus tard).
          </p>
          <div>
            <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
              Inscrire l&apos;élève
            </button>
          </div>
        </form>
      </section>

      {/* Liste des élèves de la classe choisie */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Élèves de {libelleClasse(classeChoisie)} ({eleves?.length ?? 0})
        </h2>
        {eleves && eleves.length > 0 ? (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
            {eleves.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">
                    {e.prenom} {e.nom}
                  </p>
                  <p className="text-sm text-slate-400">Matricule : {e.identifiant}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/ecole/eleves/${e.id}/bulletin`}
                    className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
                  >
                    Bulletin
                  </Link>
                  <form action={supprimerEleve}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="classe_id" value={classeChoisie.id} />
                    <button className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            Aucun élève dans cette classe. Inscrivez-en un ci-dessus.
          </p>
        )}
      </section>
    </div></main>
  );
}
