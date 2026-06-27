import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ListeAbsences, type AbsenceAffiche } from "@/components/ListeAbsences";

// Forme brute d'une absence lue en base (avec son affectation jointe).
type AbsenceBrut = {
  id: string;
  date_absence: string;
  statut: string;
  justifie: boolean;
  motif: string | null;
  affectation: {
    matiere: { nom: string } | null;
    professeur: { prenom: string; nom: string } | null;
  } | null;
};

export default async function MesAbsencesPage() {
  const { supabase, profil } = await requireProfil();

  // Réservé aux élèves (le parent passe par la page de chaque enfant).
  if (profil.role !== "eleve") {
    redirect("/espace");
  }

  // L'élève voit SES absences (la RLS ne laisse passer que les siennes).
  const { data } = await supabase
    .from("absences")
    .select(
      "id, date_absence, statut, justifie, motif, affectation:affectations ( matiere:matieres ( nom ), professeur:profils ( prenom, nom ) )"
    )
    .eq("eleve_id", profil.id)
    .order("date_absence", { ascending: false })
    .returns<AbsenceBrut[]>();

  const absences: AbsenceAffiche[] = (data ?? []).map((a) => ({
    id: a.id,
    date_absence: a.date_absence,
    statut: a.statut,
    justifie: a.justifie,
    motif: a.motif,
    matiere: a.affectation?.matiere?.nom ?? "—",
    professeur: a.affectation?.professeur
      ? `${a.affectation.professeur.prenom} ${a.affectation.professeur.nom}`
      : "—",
  }));

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mes absences</h1>
            <p className="text-sm text-slate-400">
              {profil.prenom} {profil.nom}
            </p>
          </div>
          <Link
            href="/espace"
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Retour
          </Link>
        </header>

        <ListeAbsences absences={absences} />
      </div>
    </main>
  );
}
