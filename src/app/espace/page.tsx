import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireProfil } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { messageEncouragement } from "./encouragements";

const LIBELLE_ROLE: Record<string, string> = {
  professeur: "Professeur",
  eleve: "Élève",
  parent: "Parent",
};

// Jours de la semaine, indexés comme JavaScript : 0 = dimanche … 6 = samedi.
// En base, nos créneaux utilisent 1 = lundi … 6 = samedi (jamais 0).
const JOURS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

// Coupe une heure Postgres "HH:MM:SS" en "HH:MM".
function courteHeure(h: string): string {
  return h.slice(0, 5);
}

// Met une majuscule à la première lettre.
function capitale(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Lien de navigation présenté sous forme de carte (icône + libellé).
type LienEspace = { href: string; libelle: string; icone: string };

const LIENS_PAR_ROLE: Record<string, LienEspace[]> = {
  eleve: [
    { href: "/espace/mes-notes", libelle: "Mes notes", icone: "📊" },
    { href: "/espace/mes-devoirs", libelle: "Mes devoirs", icone: "📝" },
    { href: "/espace/mes-absences", libelle: "Mes absences", icone: "📅" },
    { href: "/espace/emploi-du-temps", libelle: "Emploi du temps", icone: "🕐" },
    { href: "/messages", libelle: "Messages", icone: "💬" },
  ],
  professeur: [
    { href: "/espace/notes", libelle: "Saisir des notes", icone: "📊" },
    { href: "/espace/devoirs", libelle: "Donner un devoir", icone: "📝" },
    { href: "/espace/absences", libelle: "Faire l'appel", icone: "✅" },
    { href: "/espace/emploi-du-temps", libelle: "Emploi du temps", icone: "🕐" },
    { href: "/messages", libelle: "Messages", icone: "💬" },
  ],
  parent: [
    { href: "/espace/enfants", libelle: "Mes enfants", icone: "👨‍👩‍👧" },
    { href: "/messages", libelle: "Messages", icone: "💬" },
  ],
};

// ── Données du tableau de bord élève ──────────────────────────────────────

type CoursAffiche = {
  matiere: string;
  professeur: string;
  salle: string | null;
  debut: string; // "HH:MM"
  fin: string; // "HH:MM"
  quand: string; // "Dans 25 min", "Aujourd'hui", "Demain", "jeudi"…
};

type CreneauBrut = {
  jour: number;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  affectation: {
    matiere: { nom: string } | null;
    professeur: { prenom: string; nom: string } | null;
  } | null;
};

type TableauBordEleve = {
  prochain: CoursAffiche | null;
  suite: CoursAffiche[]; // autres cours restants aujourd'hui
  moyenne: number | null;
  devoirsARendre: number;
};

// Convertit "HH:MM:SS" en minutes depuis minuit (pour comparer des heures).
function enMinutes(h: string): number {
  const [hh, mm] = h.split(":");
  return Number(hh) * 60 + Number(mm);
}

// Étiquette « quand » d'un cours, relative à maintenant.
function libelleQuand(delta: number, minutesAvant: number): string {
  if (delta === 0) {
    if (minutesAvant <= 0) return "En cours";
    if (minutesAvant < 60) return `Dans ${minutesAvant} min`;
    const h = Math.floor(minutesAvant / 60);
    const m = minutesAvant % 60;
    return m === 0 ? `Dans ${h} h` : `Dans ${h} h ${String(m).padStart(2, "0")}`;
  }
  if (delta === 1) return "Demain";
  return capitale(JOURS[(new Date().getDay() + delta) % 7]);
}

function versCoursAffiche(c: CreneauBrut, delta: number, minutesAvant: number): CoursAffiche {
  return {
    matiere: c.affectation?.matiere?.nom ?? "Cours",
    professeur: c.affectation?.professeur
      ? `${c.affectation.professeur.prenom} ${c.affectation.professeur.nom}`
      : "—",
    salle: c.salle,
    debut: courteHeure(c.heure_debut),
    fin: courteHeure(c.heure_fin),
    quand: libelleQuand(delta, minutesAvant),
  };
}

async function getTableauBordEleve(
  supabase: SupabaseClient,
  eleveId: string
): Promise<TableauBordEleve> {
  // La classe de l'élève.
  const { data: moi } = await supabase
    .from("profils")
    .select("classe_id")
    .eq("id", eleveId)
    .single<{ classe_id: string | null }>();

  const classeId = moi?.classe_id ?? null;

  const maintenant = new Date();
  const jourActuel = maintenant.getDay(); // 0 = dimanche … 6 = samedi
  const minutesActuelles = maintenant.getHours() * 60 + maintenant.getMinutes();
  const aujourdhui = maintenant.toLocaleDateString("fr-CA"); // AAAA-MM-JJ

  // ── Emploi du temps : prochain cours + suite du jour ──
  let prochain: CoursAffiche | null = null;
  let suite: CoursAffiche[] = [];

  if (classeId) {
    const { data } = await supabase
      .from("creneaux")
      .select(
        "jour, heure_debut, heure_fin, salle, affectation:affectations!inner ( classe_id, matiere:matieres ( nom ), professeur:profils ( prenom, nom ) )"
      )
      .eq("affectation.classe_id", classeId)
      .returns<CreneauBrut[]>();

    // Pour chaque créneau : dans combien de jours sa prochaine occurrence.
    // Un cours déjà commencé aujourd'hui repart à la semaine suivante (+7).
    const aVenir = (data ?? []).map((c) => {
      let delta = (c.jour - jourActuel + 7) % 7;
      if (delta === 0 && enMinutes(c.heure_debut) <= minutesActuelles) delta = 7;
      return { c, delta };
    });
    aVenir.sort(
      (a, b) => a.delta - b.delta || a.c.heure_debut.localeCompare(b.c.heure_debut)
    );

    if (aVenir.length > 0) {
      const p = aVenir[0];
      const minutesAvant = enMinutes(p.c.heure_debut) - minutesActuelles;
      prochain = versCoursAffiche(p.c, p.delta, minutesAvant);

      // « La suite aujourd'hui » : les autres cours d'aujourd'hui (delta 0),
      // hors le prochain (le premier de la liste triée).
      suite = aVenir
        .slice(1)
        .filter((x) => x.delta === 0)
        .map((x) => versCoursAffiche(x.c, 0, enMinutes(x.c.heure_debut) - minutesActuelles));
    }
  }

  // ── Moyenne générale (semestre le plus récent ayant des notes) ──
  const { data: notes } = await supabase
    .from("notes")
    .select(
      "valeur, semestre, affectation:affectations ( matiere:matieres ( nom, coefficient_defaut ) )"
    )
    .eq("eleve_id", eleveId)
    .returns<
      {
        valeur: number;
        semestre: number;
        affectation: { matiere: { nom: string; coefficient_defaut: number } | null } | null;
      }[]
    >();

  let moyenne: number | null = null;
  if (notes && notes.length > 0) {
    const sem = Math.max(...notes.map((n) => n.semestre)); // dernier semestre noté
    const duSem = notes.filter((n) => n.semestre === sem);
    // Moyenne par matière, puis moyenne générale pondérée par le coefficient.
    const parMatiere = new Map<string, { coef: number; somme: number; nb: number }>();
    for (const n of duSem) {
      const nom = n.affectation?.matiere?.nom ?? "Autres";
      const coef = Number(n.affectation?.matiere?.coefficient_defaut ?? 1);
      const e = parMatiere.get(nom) ?? { coef, somme: 0, nb: 0 };
      e.somme += Number(n.valeur);
      e.nb += 1;
      parMatiere.set(nom, e);
    }
    let totalCoef = 0;
    let totalPoints = 0;
    for (const { coef, somme, nb } of parMatiere.values()) {
      if (nb > 0) {
        totalCoef += coef;
        totalPoints += (somme / nb) * coef;
      }
    }
    moyenne = totalCoef > 0 ? totalPoints / totalCoef : null;
  }

  // ── Devoirs à rendre (de la classe, sans date ou échéance ≥ aujourd'hui) ──
  let devoirsARendre = 0;
  if (classeId) {
    const { count } = await supabase
      .from("devoirs")
      .select("id, affectation:affectations!inner ( classe_id )", {
        count: "exact",
        head: true,
      })
      .eq("affectation.classe_id", classeId)
      .or(`date_pour_le.gte.${aujourdhui},date_pour_le.is.null`);
    devoirsARendre = count ?? 0;
  }

  return { prochain, suite, moyenne, devoirsARendre };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function EspacePage() {
  const { supabase, profil } = await requireProfil();
  const roleLisible = LIBELLE_ROLE[profil.role] ?? profil.role;
  const liens = LIENS_PAR_ROLE[profil.role] ?? [];
  const initiales = `${profil.prenom?.[0] ?? ""}${profil.nom?.[0] ?? ""}`.toUpperCase();

  const dateDuJour = capitale(
    new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  );

  const bord =
    profil.role === "eleve" ? await getTableauBordEleve(supabase, profil.id) : null;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* En-tête */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400">{dateDuJour}</p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              {profil.role === "eleve" ? "Salut" : "Bonjour"} {profil.prenom} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">{roleLisible}</p>
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

        {/* Élève : tableau de bord */}
        {bord ? (
          <>
            {/* Mot d'encouragement (change à chaque connexion, adapté au niveau) */}
            {(() => {
              const mot = messageEncouragement(bord.moyenne);
              const estSavoir = mot.type === "savoir";
              return (
                <div className="mb-4 flex gap-3 rounded-2xl border border-slate-800 bg-slate-800/30 p-4">
                  <span className="text-xl" aria-hidden>
                    {estSavoir ? "💡" : "✨"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-green-400">
                      {estSavoir ? "Le savais-tu ?" : "Pour bien commencer"}
                    </p>
                    <p className="mt-1 text-sm text-slate-200">{mot.texte}</p>
                    {mot.auteur ? (
                      <p className="mt-1 text-xs italic text-slate-500">— {mot.auteur}</p>
                    ) : null}
                  </div>
                </div>
              );
            })()}

            {/* Carte verte : prochain cours */}
            {bord.prochain ? (
              <Link
                href="/espace/emploi-du-temps"
                className="mb-4 block rounded-2xl bg-green-500 p-6 shadow-lg shadow-green-500/20 transition hover:bg-green-400"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-green-900/80">
                  Prochain cours · {bord.prochain.quand}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {bord.prochain.matiere}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-slate-900/80">
                  <span>🕐 {bord.prochain.debut} – {bord.prochain.fin}</span>
                  {bord.prochain.salle ? <span>📍 Salle {bord.prochain.salle}</span> : null}
                  <span>👤 {bord.prochain.professeur}</span>
                </div>
              </Link>
            ) : (
              <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-800/30 p-6 text-center text-slate-400">
                Aucun cours à venir pour le moment.
              </div>
            )}

            {/* Deux cartes stats */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <Link
                href="/espace/mes-notes"
                className="rounded-2xl border border-slate-800 bg-slate-800/30 p-5 transition hover:border-green-500/40 hover:bg-slate-800/60"
              >
                <p className="text-sm text-slate-400">Moyenne générale</p>
                <p className="mt-1 text-2xl font-bold text-green-400">
                  {bord.moyenne !== null ? bord.moyenne.toFixed(2) : "—"}
                  <span className="text-base font-normal text-slate-500">/20</span>
                </p>
              </Link>
              <Link
                href="/espace/mes-devoirs"
                className="rounded-2xl border border-slate-800 bg-slate-800/30 p-5 transition hover:border-green-500/40 hover:bg-slate-800/60"
              >
                <p className="text-sm text-slate-400">Devoirs</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {bord.devoirsARendre}
                  <span className="text-base font-normal text-slate-500"> à rendre</span>
                </p>
              </Link>
            </div>

            {/* La suite aujourd'hui */}
            {bord.suite.length > 0 ? (
              <section className="mb-8">
                <h2 className="mb-3 text-sm font-semibold text-slate-300">
                  La suite aujourd&apos;hui
                </h2>
                <ul className="flex flex-col gap-2">
                  {bord.suite.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-800/30 px-4 py-3"
                    >
                      <span className="font-mono text-sm font-semibold text-green-400">
                        {c.debut}
                      </span>
                      <span className="h-8 w-px bg-slate-700" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{c.matiere}</p>
                        <p className="truncate text-sm text-slate-400">
                          {c.professeur}
                          {c.salle ? ` · Salle ${c.salle}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}

        {/* Grille de navigation (cartes) */}
        {liens.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {liens.map((lien) => (
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
        ) : (
          <p className="text-sm text-slate-500">
            Votre espace sera construit dans les prochaines étapes.
          </p>
        )}
      </div>
    </main>
  );
}
