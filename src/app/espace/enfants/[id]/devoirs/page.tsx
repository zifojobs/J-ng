import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ListeDevoirs, type DevoirAffiche } from "@/components/ListeDevoirs";

type DevoirBrut = {
  id: string;
  titre: string;
  consigne: string | null;
  date_pour_le: string | null;
  affectation: {
    matiere: { nom: string } | null;
    professeur: { prenom: string; nom: string } | null;
  } | null;
};

type Enfant = {
  prenom: string;
  nom: string;
  classe_id: string | null;
};

export default async function DevoirsEnfantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé aux parents.
  if (profil.role !== "parent") {
    redirect("/");
  }

  const { id } = await params;

  // On vérifie que cet élève est bien un enfant rattaché à ce parent.
  const { data: lien } = await supabase
    .from("parents_eleves")
    .select("eleve_id")
    .eq("parent_id", profil.id)
    .eq("eleve_id", id)
    .maybeSingle();

  if (!lien) {
    redirect("/espace/enfants");
  }

  // Identité + classe de l'enfant.
  const { data: enfant } = await supabase
    .from("profils")
    .select("prenom, nom, classe_id")
    .eq("id", id)
    .single<Enfant>();

  let devoirs: DevoirAffiche[] = [];
  if (enfant?.classe_id) {
    const { data } = await supabase
      .from("devoirs")
      .select(
        "id, titre, consigne, date_pour_le, affectation:affectations!inner ( classe_id, matiere:matieres ( nom ), professeur:profils ( prenom, nom ) )"
      )
      .eq("affectation.classe_id", enfant.classe_id)
      .returns<DevoirBrut[]>();

    devoirs = (data ?? []).map((d) => ({
      id: d.id,
      titre: d.titre,
      consigne: d.consigne,
      date_pour_le: d.date_pour_le,
      matiere: d.affectation?.matiere?.nom ?? "—",
      professeur: d.affectation?.professeur
        ? `${d.affectation.professeur.prenom} ${d.affectation.professeur.nom}`
        : "—",
    }));
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Devoirs</h1>
            <p className="text-sm text-slate-400">
              {enfant?.prenom} {enfant?.nom}
            </p>
          </div>
          <Link
            href="/espace/enfants"
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Retour
          </Link>
        </header>

        <ListeDevoirs devoirs={devoirs} />
      </div>
    </main>
  );
}
