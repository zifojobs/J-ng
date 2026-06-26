import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function EcolePage() {
  const { supabase, profil } = await requireProfil();

  // Réservé à l'administrateur d'école.
  if (profil.role !== "admin_ecole") {
    redirect("/");
  }

  // L'admin ne voit QUE son école (grâce à la RLS + son badge).
  const { data: ecole } = await supabase
    .from("ecoles")
    .select("nom, slug, statut, adresse, telephone, directeur")
    .single<{
      nom: string;
      slug: string;
      statut: string;
      adresse: string | null;
      telephone: string | null;
      directeur: string | null;
    }>();

  // Compteurs pour la checklist de démarrage (combien d'éléments déjà créés).
  const compter = (table: string, filtre?: { col: string; val: string }) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (filtre) q = q.eq(filtre.col, filtre.val);
    return q;
  };

  const [annees, classes, matieres, profs, eleves] = await Promise.all([
    compter("annees_scolaires"),
    compter("classes"),
    compter("matieres"),
    compter("profils", { col: "role", val: "professeur" }),
    compter("profils", { col: "role", val: "eleve" }),
  ]);

  // Les étapes de démarrage, dans l'ordre. `fait` = l'étape est déjà accomplie.
  const etapes = [
    {
      titre: "Renseigner les coordonnées",
      href: "/ecole/infos",
      fait: Boolean(ecole?.adresse || ecole?.telephone || ecole?.directeur),
    },
    { titre: "Créer une année scolaire", href: "/ecole/annees", fait: (annees.count ?? 0) > 0 },
    { titre: "Créer des classes", href: "/ecole/classes", fait: (classes.count ?? 0) > 0 },
    { titre: "Ajouter des matières", href: "/ecole/matieres", fait: (matieres.count ?? 0) > 0 },
    { titre: "Ajouter des professeurs", href: "/ecole/professeurs", fait: (profs.count ?? 0) > 0 },
    { titre: "Inscrire des élèves", href: "/ecole/eleves", fait: (eleves.count ?? 0) > 0 },
  ];
  const nbFaites = etapes.filter((e) => e.fait).length;
  const toutPret = nbFaites === etapes.length;

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espace école</h1>
          <p className="text-sm text-gray-500">
            {profil.prenom} {profil.nom} — Administrateur
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
            Se déconnecter
          </button>
        </form>
      </header>

      {/* Checklist de démarrage : visible tant que tout n'est pas configuré */}
      {!toutPret ? (
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Premiers pas</h2>
            <span className="text-sm font-medium text-gray-500">
              {nbFaites}/{etapes.length}
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {etapes.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                >
                  <span
                    className={
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm " +
                      (e.fait
                        ? "bg-green-100 text-green-700"
                        : "border border-gray-300 text-transparent")
                    }
                  >
                    ✓
                  </span>
                  <span
                    className={
                      "text-sm " +
                      (e.fait ? "text-gray-400 line-through" : "font-medium text-gray-900")
                    }
                  >
                    {e.titre}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Votre école</p>
        <p className="mt-1 text-xl font-semibold text-gray-900">
          {ecole?.nom ?? "—"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/ecole/tableau-de-bord"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Tableau de bord
          </Link>
          <Link
            href="/ecole/infos"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Coordonnées de l&apos;école
          </Link>
          <Link
            href="/ecole/matieres"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Gérer les matières
          </Link>
          <Link
            href="/ecole/annees"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Gérer les années scolaires
          </Link>
          <Link
            href="/ecole/classes"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Gérer les classes
          </Link>
          <Link
            href="/ecole/professeurs"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Gérer les professeurs
          </Link>
          <Link
            href="/ecole/eleves"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Gérer les élèves
          </Link>
          <Link
            href="/ecole/affectations"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Gérer les affectations
          </Link>
          <Link
            href="/ecole/parents"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Gérer les parents
          </Link>
          <Link
            href="/ecole/emploi-du-temps"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Emploi du temps
          </Link>
          <Link
            href="/messages"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Messagerie
          </Link>
        </div>
      </section>
    </main>
  );
}
