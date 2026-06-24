import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import {
  ajouterParent,
  lierEnfant,
  delierEnfant,
  supprimerParent,
} from "./actions";

type Eleve = {
  id: string;
  prenom: string;
  nom: string;
};

type Lien = {
  id: string;
  eleve: { prenom: string; nom: string } | null;
};

type Parent = {
  id: string;
  prenom: string;
  nom: string;
  identifiant: string | null;
  parents_eleves: Lien[];
};

export default async function ParentsPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; succes?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  if (profil.role !== "admin_ecole") {
    redirect("/");
  }

  const { erreur, succes } = await searchParams;

  // Les élèves de l'école (pour les menus déroulants).
  const { data: eleves } = await supabase
    .from("profils")
    .select("id, prenom, nom")
    .eq("role", "eleve")
    .order("nom", { ascending: true })
    .returns<Eleve[]>();

  // Les parents de l'école, avec leurs enfants liés.
  const { data: parents } = await supabase
    .from("profils")
    .select(
      "id, prenom, nom, identifiant, parents_eleves!parents_eleves_parent_id_fkey ( id, eleve:profils!parents_eleves_eleve_id_fkey ( prenom, nom ) )"
    )
    .eq("role", "parent")
    .order("nom", { ascending: true })
    .returns<Parent[]>();

  const pasDEleve = !eleves || eleves.length === 0;

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
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

      {pasDEleve ? (
        <p className="mb-8 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Vous devez d&apos;abord inscrire des élèves avant de créer des parents.{" "}
          <Link href="/ecole/eleves" className="font-medium underline">
            Gérer les élèves
          </Link>
        </p>
      ) : (
        /* Création d'un parent + rattachement à un premier enfant */
        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Ajouter un parent</h2>
          <form action={ajouterParent} className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Prénom</label>
                <input
                  name="prenom"
                  required
                  placeholder="Awa"
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
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Matricule (identifiant de connexion)
                </label>
                <input
                  name="matricule"
                  required
                  placeholder="PAR-2026-001"
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
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Enfant rattaché</label>
              <select
                name="eleve_id"
                required
                defaultValue=""
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
              >
                <option value="" disabled>
                  Choisir…
                </option>
                {eleves!.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.prenom} {e.nom}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500">
              Le parent se connectera avec son <strong>matricule</strong> et ce mot de
              passe (vous pourrez rattacher d&apos;autres enfants ensuite).
            </p>
            <div>
              <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
                Ajouter le parent
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Liste des parents */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Parents ({parents?.length ?? 0})
        </h2>
        {parents && parents.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {parents.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {p.prenom} {p.nom}
                    </p>
                    <p className="text-sm text-gray-500">Matricule : {p.identifiant}</p>
                  </div>
                  <form action={supprimerParent}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                      Supprimer
                    </button>
                  </form>
                </div>

                {/* Enfants liés */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Enfants
                  </p>
                  {p.parents_eleves.length > 0 ? (
                    <ul className="flex flex-col gap-1">
                      {p.parents_eleves.map((lien) => (
                        <li
                          key={lien.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-gray-900">
                            {lien.eleve
                              ? `${lien.eleve.prenom} ${lien.eleve.nom}`
                              : "—"}
                          </span>
                          <form action={delierEnfant}>
                            <input type="hidden" name="id" value={lien.id} />
                            <button className="text-xs text-red-600 hover:underline">
                              retirer
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Aucun enfant rattaché.</p>
                  )}

                  {/* Rattacher un autre enfant */}
                  {!pasDEleve ? (
                    <form
                      action={lierEnfant}
                      className="mt-3 flex flex-col gap-2 sm:flex-row"
                    >
                      <input type="hidden" name="parent_id" value={p.id} />
                      <select
                        name="eleve_id"
                        required
                        defaultValue=""
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-900"
                      >
                        <option value="" disabled>
                          Rattacher un enfant…
                        </option>
                        {eleves!.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.prenom} {e.nom}
                          </option>
                        ))}
                      </select>
                      <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                        Rattacher
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Aucun parent pour le moment.</p>
        )}
      </section>
    </main>
  );
}
