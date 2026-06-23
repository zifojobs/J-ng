import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";

// Page d'accueil = aiguilleur : on envoie chaque rôle vers son espace.
export default async function HomePage() {
  const { profil } = await requireProfil();

  switch (profil.role) {
    case "super_admin":
      redirect("/super-admin");
    case "admin_ecole":
      redirect("/ecole");
    default:
      // professeur / eleve / parent : espaces construits aux étapes suivantes.
      redirect("/espace");
  }
}
