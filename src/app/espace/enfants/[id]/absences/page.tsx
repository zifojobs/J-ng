import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { ListeAbsences, type AbsenceAffiche } from "@/components/ListeAbsences";

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

type Enfant = {
  prenom: string;
  nom: string;
};

export default async function AbsencesEnfantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string; succes?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé aux parents.
  if (profil.role !== "parent") {
    redirect("/");
  }

  const { id } = await params;
  const { erreur, succes } = await searchParams;

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

  // Identité de l'enfant.
  const { data: enfant } = await supabase
    .from("profils")
    .select("prenom, nom")
    .eq("id", id)
    .single<Enfant>();

  // Les absences de l'enfant (la RLS limite aux enfants de ce parent).
  const { data } = await supabase
    .from("absences")
    .select(
      "id, date_absence, statut, justifie, motif, affectation:affectations ( matiere:matieres ( nom ), professeur:profils ( prenom, nom ) )"
    )
    .eq("eleve_id", id)
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
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Absences</h1>
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

      <ListeAbsences absences={absences} justification={{ enfantId: id }} />
    </main>
  );
}
