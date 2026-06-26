import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ListeDevoirs, type DevoirAffiche } from "@/components/ListeDevoirs";

// Forme brute d'un devoir lu en base (avec son affectation jointe).
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

export default async function MesDevoirsPage() {
  const { supabase, profil } = await requireProfil();

  // Réservé aux élèves (le parent passe par la page de chaque enfant).
  if (profil.role !== "eleve") {
    redirect("/espace");
  }

  // L'élève voit les devoirs de SA classe.
  const { data: moi } = await supabase
    .from("profils")
    .select("classe_id")
    .eq("id", profil.id)
    .single<{ classe_id: string | null }>();

  let devoirs: DevoirAffiche[] = [];

  if (moi?.classe_id) {
    const { data } = await supabase
      .from("devoirs")
      .select(
        "id, titre, consigne, date_pour_le, affectation:affectations!inner ( classe_id, matiere:matieres ( nom ), professeur:profils ( prenom, nom ) )"
      )
      .eq("affectation.classe_id", moi.classe_id)
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
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes devoirs</h1>
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

      <ListeDevoirs devoirs={devoirs} />
    </main>
  );
}
