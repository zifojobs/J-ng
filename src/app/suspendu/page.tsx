import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { logout } from "@/app/login/actions";

// Écran affiché aux utilisateurs d'une école suspendue.
// `ignorerSuspension: true` : sinon requireProfil renverrait ici en boucle.
export default async function SuspenduPage() {
  const { supabase, profil } = await requireProfil({ ignorerSuspension: true });

  // Le super-admin n'a pas d'école : il n'a rien à faire ici.
  if (profil.role === "super_admin") {
    redirect("/super-admin");
  }

  // Si l'école n'est ni suspendue ni expirée, on renvoie vers l'espace normal.
  const { data: ecole } = await supabase
    .from("ecoles")
    .select("nom, statut, date_echeance")
    .eq("id", profil.ecole_id ?? "")
    .single<{ nom: string; statut: string; date_echeance: string | null }>();

  const aujourdhui = new Date().toLocaleDateString("fr-CA");
  const expiree =
    !!ecole?.date_echeance && ecole.date_echeance < aujourdhui;
  const suspendu = ecole?.statut === "suspendu";

  if (!suspendu && !expiree) {
    redirect("/");
  }

  // Message adapté : suspension manuelle prioritaire, sinon échéance dépassée.
  const dateEcheanceFr = ecole?.date_echeance
    ? new Date(ecole.date_echeance).toLocaleDateString("fr-FR")
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
        <h1 className="text-xl font-bold text-gray-900">
          {suspendu ? "Abonnement suspendu" : "Abonnement expiré"}
        </h1>
        <p className="mt-3 text-sm text-gray-700">
          L&apos;accès à <span className="font-semibold">{ecole?.nom}</span>{" "}
          {suspendu ? "est momentanément suspendu." : "est arrivé à échéance."}
        </p>
        {!suspendu && dateEcheanceFr ? (
          <p className="mt-1 text-sm text-gray-600">
            Abonnement échu le {dateEcheanceFr}.
          </p>
        ) : null}
        <p className="mt-2 text-sm text-gray-600">
          Merci de contacter l&apos;administration de la plateforme pour
          régulariser l&apos;abonnement et rétablir l&apos;accès.
        </p>

        <form action={logout} className="mt-6">
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}
