import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { Bulletin } from "@/components/Bulletin";

export default async function BulletinEleveAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé à l'administrateur d'école.
  if (profil.role !== "admin_ecole") {
    redirect("/");
  }

  const { id } = await params;

  // On vérifie que c'est bien un élève (la RLS le limite déjà à SON école).
  const { data: eleve } = await supabase
    .from("profils")
    .select("id")
    .eq("id", id)
    .eq("role", "eleve")
    .maybeSingle();

  if (!eleve) {
    redirect("/ecole/eleves");
  }

  return <Bulletin supabase={supabase} eleveId={id} retourHref="/ecole/eleves" />;
}
