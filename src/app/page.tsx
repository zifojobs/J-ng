import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";

// Étiquettes lisibles pour chaque rôle.
const LIBELLE_ROLE: Record<string, string> = {
  super_admin: "Super-administrateur",
  admin_ecole: "Administrateur d'école",
  professeur: "Professeur",
  eleve: "Élève",
  parent: "Parent",
};

export default async function HomePage() {
  const supabase = await createClient();

  // Protection : pas connecté -> on renvoie vers la page de connexion.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // On lit le profil de l'utilisateur connecté (autorisé par la RLS : id = soi-même).
  const { data: profil } = await supabase
    .from("profils")
    .select("prenom, nom, role")
    .eq("id", user.id)
    .single();

  const roleLisible = profil ? LIBELLE_ROLE[profil.role] ?? profil.role : "—";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 p-4 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour {profil?.prenom ?? ""} 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Vous êtes connecté en tant que{" "}
          <span className="font-semibold text-gray-900">{roleLisible}</span>.
        </p>

        <form action={logout} className="mt-6">
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}
