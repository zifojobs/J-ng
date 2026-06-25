import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { EmploiDuTemps, type CreneauAffiche } from "@/components/EmploiDuTemps";

// Forme brute d'un créneau lu en base (avec son affectation jointe).
type CreneauBrut = {
  id: string;
  jour: number;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  affectation: {
    matiere: { nom: string } | null;
    classe: { nom: string } | null;
    professeur: { prenom: string; nom: string } | null;
  } | null;
};

export default async function MonEmploiDuTempsPage() {
  const { supabase, profil } = await requireProfil();

  // Cette page est pour l'élève et le professeur. Le parent passe par la page
  // de chaque enfant.
  if (profil.role !== "eleve" && profil.role !== "professeur") {
    redirect("/espace");
  }

  let creneaux: CreneauAffiche[] = [];

  if (profil.role === "eleve") {
    // L'élève voit l'emploi du temps de SA classe.
    const { data: moi } = await supabase
      .from("profils")
      .select("classe_id")
      .eq("id", profil.id)
      .single<{ classe_id: string | null }>();

    if (moi?.classe_id) {
      const { data } = await supabase
        .from("creneaux")
        .select(
          "id, jour, heure_debut, heure_fin, salle, affectation:affectations!inner ( classe_id, matiere:matieres ( nom ), professeur:profils ( prenom, nom ) )"
        )
        .eq("affectation.classe_id", moi.classe_id)
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
  } else {
    // Le professeur voit SES cours (ses affectations), avec la classe.
    const { data } = await supabase
      .from("creneaux")
      .select(
        "id, jour, heure_debut, heure_fin, salle, affectation:affectations!inner ( professeur_id, matiere:matieres ( nom ), classe:classes ( nom ) )"
      )
      .eq("affectation.professeur_id", profil.id)
      .returns<CreneauBrut[]>();

    creneaux = (data ?? []).map((c) => ({
      id: c.id,
      jour: c.jour,
      heure_debut: c.heure_debut,
      heure_fin: c.heure_fin,
      salle: c.salle,
      titre: c.affectation?.matiere?.nom ?? "—",
      sousTitre: c.affectation?.classe ? `Classe ${c.affectation.classe.nom}` : "—",
    }));
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon emploi du temps</h1>
          <p className="text-sm text-gray-500">
            {profil.prenom} {profil.nom}
          </p>
        </div>
        <Link
          href="/espace"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Retour
        </Link>
      </header>

      <EmploiDuTemps creneaux={creneaux} />
    </main>
  );
}
