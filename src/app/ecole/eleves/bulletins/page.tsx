import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { Bulletin } from "@/components/Bulletin";
import { BoutonImprimer } from "@/components/BoutonImprimer";

type Classe = {
  id: string;
  nom: string;
  annees_scolaires: { libelle: string } | null;
};

type Eleve = { id: string; prenom: string; nom: string };

// Page admin : imprimer d'un coup les bulletins de TOUTE une classe, pour un
// semestre donné. On réutilise le composant Bulletin en mode « lot » (sans
// barre individuelle, avec saut de page entre chaque élève).
export default async function BulletinsClassePage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; semestre?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé à l'administrateur d'école.
  if (profil.role !== "admin_ecole") {
    redirect("/");
  }

  const { classe, semestre } = await searchParams;
  const sem = semestre === "2" ? 2 : 1;

  // Toutes les classes de l'école (RLS = sa propre école).
  const { data: classes } = await supabase
    .from("classes")
    .select("id, nom, annees_scolaires ( libelle )")
    .order("nom", { ascending: true })
    .returns<Classe[]>();

  if (!classes || classes.length === 0) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Bulletins de classe</h1>
          <Link
            href="/ecole/eleves"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            ← Retour
          </Link>
        </header>
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucune classe pour le moment.
        </p>
      </main>
    );
  }

  // Classe choisie : celle de l'URL, sinon la première.
  const classeChoisie = classes.find((c) => c.id === classe) ?? classes[0];

  // Les élèves de la classe choisie.
  const { data: eleves } = await supabase
    .from("profils")
    .select("id, prenom, nom")
    .eq("role", "eleve")
    .eq("classe_id", classeChoisie.id)
    .order("nom", { ascending: true })
    .returns<Eleve[]>();

  const libelleClasse = (c: Classe) =>
    c.nom + (c.annees_scolaires ? ` (${c.annees_scolaires.libelle})` : "");

  return (
    <div>
      {/* Barre de réglages (cachée à l'impression) */}
      <section className="mx-auto max-w-3xl p-4 sm:p-8 print:hidden">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Bulletins de classe</h1>
          <Link
            href="/ecole/eleves"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            ← Retour
          </Link>
        </header>

        {/* Choix de la classe */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Classe</p>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/ecole/eleves/bulletins?classe=${c.id}&semestre=${sem}`}
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
        </div>

        {/* Choix du semestre */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-gray-700">Semestre</p>
          <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 text-sm">
            {([1, 2] as const).map((s) => (
              <Link
                key={s}
                href={`/ecole/eleves/bulletins?classe=${classeChoisie.id}&semestre=${s}`}
                className={
                  "px-3 py-1.5 " +
                  (s === sem
                    ? "bg-gray-900 font-medium text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100")
                }
              >
                {s === 1 ? "1ᵉʳ semestre" : "2ᵉ semestre"}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {eleves?.length ?? 0} élève(s) — {libelleClasse(classeChoisie)}
          </p>
          {eleves && eleves.length > 0 ? <BoutonImprimer /> : null}
        </div>
      </section>

      {/* Les bulletins, un par élève, avec saut de page à l'impression */}
      {!eleves || eleves.length === 0 ? (
        <p className="mx-auto max-w-3xl px-4 text-sm text-gray-500 sm:px-8 print:hidden">
          Aucun élève dans cette classe.
        </p>
      ) : (
        eleves.map((e) => (
          <Bulletin
            key={e.id}
            supabase={supabase}
            eleveId={e.id}
            retourHref="/ecole/eleves"
            semestre={sem}
            bulletinHref={`/ecole/eleves/${e.id}/bulletin`}
            enLot
          />
        ))
      )}
    </div>
  );
}
