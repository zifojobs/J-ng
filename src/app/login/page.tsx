import FormulaireConnexion from "./FormulaireConnexion";

// Page de connexion. `searchParams` permet d'afficher un message d'erreur.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-10">
      <div className="w-full max-w-sm">
        {/* En-tête : logo + marque */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 text-3xl font-bold text-slate-900 shadow-lg shadow-green-500/20">
            J
          </div>
          <h1 className="text-2xl font-bold text-white">Jàng</h1>
          <p className="mt-1 text-sm text-slate-400">
            L&apos;école, simplement. Bienvenue.
          </p>
        </div>

        {/* Carte du formulaire */}
        <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-6 shadow-xl">
          <FormulaireConnexion erreur={erreur} />
        </div>

        {/* Pied : inscription */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Vous dirigez une école ?{" "}
          <a
            href="/inscription"
            className="font-medium text-green-400 hover:text-green-300"
          >
            Inscrire mon école →
          </a>
        </p>
      </div>
    </main>
  );
}
