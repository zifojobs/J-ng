import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { Bulletin } from "@/components/Bulletin";

export default async function BulletinEnfantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ semestre?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé aux parents.
  if (profil.role !== "parent") {
    redirect("/");
  }

  const { id } = await params;
  const { semestre } = await searchParams;
  const sem = semestre === "2" ? 2 : 1;

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

  return (
    <Bulletin
      supabase={supabase}
      eleveId={id}
      retourHref="/espace/enfants"
      semestre={sem}
      bulletinHref={`/espace/enfants/${id}/bulletin`}
    />
  );
}
