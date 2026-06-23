import { requireProfil } from "@/lib/auth";
import { logout } from "@/app/login/actions";

const LIBELLE_ROLE: Record<string, string> = {
  professeur: "Professeur",
  eleve: "Élève",
  parent: "Parent",
};

export default async function EspacePage() {
  const { profil } = await requireProfil();
  const roleLisible = LIBELLE_ROLE[profil.role] ?? profil.role;

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour {profil.prenom} 👋
        </h1>
        <form action={logout}>
          <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
            Se déconnecter
          </button>
        </form>
      </header>
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-gray-600">
          Vous êtes connecté en tant que{" "}
          <span className="font-semibold text-gray-900">{roleLisible}</span>.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Votre espace sera construit dans les prochaines étapes.
        </p>
      </section>
    </main>
  );
}
