import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { logout } from "@/app/login/actions";

// Lien de navigation présenté sous forme de carte (icône + libellé).
type LienAdmin = { href: string; libelle: string; icone: string };

const LIENS_ADMIN: LienAdmin[] = [
  { href: "/ecole/infos", libelle: "Coordonnées", icone: "🏫" },
  { href: "/ecole/annees", libelle: "Années scolaires", icone: "📆" },
  { href: "/ecole/classes", libelle: "Classes", icone: "🏛️" },
  { href: "/ecole/matieres", libelle: "Matières", icone: "📚" },
  { href: "/ecole/professeurs", libelle: "Professeurs", icone: "👨‍🏫" },
  { href: "/ecole/eleves", libelle: "Élèves", icone: "🎓" },
  { href: "/ecole/affectations", libelle: "Affectations", icone: "🔗" },
  { href: "/ecole/parents", libelle: "Parents", icone: "👪" },
  { href: "/ecole/emploi-du-temps", libelle: "Emploi du temps", icone: "🕐" },
  { href: "/messages", libelle: "Messagerie", icone: "💬" },
];

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

  const initiales = `${profil.prenom?.[0] ?? ""}${profil.nom?.[0] ?? ""}`.toUpperCase();

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* En-tête */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400">Administration</p>
            <h1 className="mt-1 text-2xl font-bold text-white">{ecole?.nom ?? "—"}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {profil.prenom} {profil.nom}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500 font-bold text-slate-900">
              {initiales}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/compte/mot-de-passe"
                className="text-xs text-slate-400 transition hover:text-slate-200"
              >
                Mot de passe
              </Link>
              <span className="text-slate-700">·</span>
              <form action={logout}>
                <button className="text-xs text-slate-400 transition hover:text-slate-200">
                  Se déconnecter
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Cartes KPI : effectifs */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-5">
            <p className="text-sm text-slate-400">Élèves</p>
            <p className="mt-1 text-3xl font-bold text-white">{eleves.count ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-5">
            <p className="text-sm text-slate-400">Classes</p>
            <p className="mt-1 text-3xl font-bold text-white">{classes.count ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-5">
            <p className="text-sm text-slate-400">Profs</p>
            <p className="mt-1 text-3xl font-bold text-white">{profs.count ?? 0}</p>
          </div>
        </div>

        {/* Accès mis en avant : le tableau de bord détaillé (présence, moyennes, activité) */}
        <Link
          href="/ecole/tableau-de-bord"
          className="mb-6 flex items-center justify-between rounded-2xl bg-green-500 p-5 shadow-lg shadow-green-500/20 transition hover:bg-green-400"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-900/80">
              Pilotage
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              Tableau de bord 📈
            </p>
            <p className="text-sm text-slate-900/80">
              Présence, moyennes par classe, activité récente
            </p>
          </div>
          <span className="text-2xl text-slate-900">→</span>
        </Link>

        {/* Checklist de démarrage : visible tant que tout n'est pas configuré */}
        {!toutPret ? (
          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Premiers pas</h2>
              <span className="text-sm font-medium text-slate-400">
                {nbFaites}/{etapes.length}
              </span>
            </div>
            <ul className="flex flex-col gap-1">
              {etapes.map((e) => (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-800/60"
                  >
                    <span
                      className={
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm " +
                        (e.fait
                          ? "bg-green-500 text-slate-900"
                          : "border border-slate-600 text-transparent")
                      }
                    >
                      ✓
                    </span>
                    <span
                      className={
                        "text-sm " +
                        (e.fait ? "text-slate-500 line-through" : "font-medium text-white")
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

        {/* Grille de navigation (cartes) */}
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Gérer mon école</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LIENS_ADMIN.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="flex flex-col items-start gap-3 rounded-2xl border border-slate-800 bg-slate-800/30 p-5 transition hover:border-green-500/40 hover:bg-slate-800/60"
            >
              <span className="text-2xl">{lien.icone}</span>
              <span className="font-medium text-white">{lien.libelle}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
