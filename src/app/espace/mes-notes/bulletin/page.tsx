import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { Bulletin } from "@/components/Bulletin";

export default async function BulletinPage() {
  const { supabase, profil } = await requireProfil();

  // Réservé aux élèves : chacun ne voit que SON bulletin.
  if (profil.role !== "eleve") {
    redirect("/");
  }

  return <Bulletin supabase={supabase} eleveId={profil.id} retourHref="/espace/mes-notes" />;
}
