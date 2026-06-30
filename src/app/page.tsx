import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VitrineLanding from "./VitrineLanding";

// Page d'accueil PUBLIQUE (la « vitrine »).
// - Visiteur non connecté : on présente Jàng (maquette Claude Design).
// - Utilisateur connecté : on l'aiguille vers son espace.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profil } = await supabase
      .from("profils")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    if (profil?.role === "super_admin") redirect("/super-admin");
    if (profil?.role === "admin_ecole") redirect("/ecole");
    if (profil) redirect("/espace");
  }

  return <VitrineLanding />;
}
