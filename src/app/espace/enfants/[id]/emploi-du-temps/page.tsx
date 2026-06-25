import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { EmploiDuTemps, type CreneauAffiche } from "@/components/EmploiDuTemps";

type CreneauBrut = {
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

type Enfant = {
  prenom: string;
  nom: string;
  classe_id: string | null;
};

export default async function EmploiDuTempsEnfantPage({
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

  let creneaux: CreneauAffiche[] = [];
  if (enfant?.classe_id) {
    const { data } = await supabase
      .from("creneaux")
      .select(
        "id, jour, heure_debut, heure_fin, salle, affectation:affectations!inner ( classe_id, matiere:matieres ( nom ), professeur:profils ( prenom, nom ) )"
      )
      .eq("affectation.classe_id", enfant.classe_id)
      .returns<CreneauBrut[]>();

    creneaux = (data ?? []).map((c) => ({
      id: c.id,
      jour: c.jour,
      heure_debut: c.heure_debut,
      heure_fin: c.heure_fin,
      salle: c.salle,
      titre: c.affectation?.matiere?.nom ?? "—",
      sousTitre: c.affectation?.professeur
        ? `${c.affectation.professeur.prenom} ${c.affectation.professeur.nom}`
        : "—",
    }));
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emploi du temps</h1>
          <p className="text-sm text-gray-500">
            {enfant?.prenom} {enfant?.nom}
          </p>
        </div>
        <Link
          href="/espace/enfants"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Retour
        </Link>
      </header>

      <EmploiDuTemps creneaux={creneaux} />
    </main>
  );
}
