import Link from "next/link";
import { requireProfil } from "@/lib/auth";
import { changerMonMotDePasse } from "./actions";

// Page « Changer mon mot de passe » — pour tous les rôles connectés. Utile
// surtout au directeur qui reçoit un mot de passe provisoire à la création.
export default async function MotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; succes?: string }>;
}) {
  const { profil } = await requireProfil();
  const { erreur, succes } = await searchParams;

  // Retour vers l'espace du rôle (admin -> /ecole, autres -> /espace).
  const retour = profil.role === "admin_ecole" ? "/ecole" : "/espace";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
        <h1 className="mb-1 text-2xl font-bold text-white">Changer mon mot de passe</h1>
        <p className="mb-6 text-sm text-slate-400">
          Choisissez un nouveau mot de passe (au moins 6 caractères).
        </p>

        {succes ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            <p className="font-medium">Mot de passe mis à jour.</p>
            <Link href={retour} className="mt-3 inline-block font-medium underline">
              Retour à mon espace
            </Link>
          </div>
        ) : (
          <>
            {erreur ? (
              <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {erreur}
              </p>
            ) : null}

            <form action={changerMonMotDePasse} className="grid gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">
                  Nouveau mot de passe
                </label>
                <input
                  name="nouveau"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">
                  Confirmer le mot de passe
                </label>
                <input
                  name="confirmation"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <Link href={retour} className="text-sm text-slate-400 hover:underline">
                  ← Retour
                </Link>
                <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
                  Enregistrer
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
