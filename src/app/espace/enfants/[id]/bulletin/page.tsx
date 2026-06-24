import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { Bulletin } from "@/components/Bulletin";

export default async function BulletinEnfantPage({
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

  return <Bulletin supabase={supabase} eleveId={id} retourHref="/espace/enfants" />;
}
