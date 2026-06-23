import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function EcolePage() {
  const { supabase, profil } = await requireProfil();

  // Réservé à l'administrateur d'école.
  if (profil.role !== "admin_ecole") {
    redirect("/");
  }

  // L'admin ne voit QUE son école (grâce à la RLS + son badge).
  const { data: ecole } = await supabase
    .from("ecoles")
    .select("nom, slug, statut")
    .single();

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espace école</h1>
          <p className="text-sm text-gray-500">
            {profil.prenom} {profil.nom} — Administrateur
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
            Se déconnecter
          </button>
        </form>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Votre école</p>
        <p className="mt-1 text-xl font-semibold text-gray-900">
          {ecole?.nom ?? "—"}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          La gestion des classes, matières, professeurs et élèves arrivera à la
          prochaine étape.
        </p>
      </section>
    </main>
  );
}
