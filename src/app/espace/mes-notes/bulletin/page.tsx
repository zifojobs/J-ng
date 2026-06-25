import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { Bulletin } from "@/components/Bulletin";

export default async function BulletinPage({
  searchParams,
}: {
  searchParams: Promise<{ semestre?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  // Réservé aux élèves : chacun ne voit que SON bulletin.
  if (profil.role !== "eleve") {
    redirect("/");
  }

  const { semestre } = await searchParams;
  const sem = semestre === "2" ? 2 : 1;

  return (
    <Bulletin
      supabase={supabase}
      eleveId={profil.id}
      retourHref="/espace/mes-notes"
      semestre={sem}
      bulletinHref="/espace/mes-notes/bulletin"
    />
  );
}
