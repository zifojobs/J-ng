import { login } from "./actions";

// Page de connexion. `searchParams` permet d'afficher un message d'erreur.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Jàng</h1>
        <p className="mb-6 text-sm text-gray-500">
          Connectez-vous à votre espace scolaire.
        </p>

        {erreur ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erreur}
          </p>
        ) : null}

        <form action={login} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="identifiant" className="text-sm font-medium text-gray-700">
              Email ou matricule
            </label>
            <input
              id="identifiant"
              name="identifiant"
              type="text"
              required
              autoComplete="username"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="code_ecole" className="text-sm font-medium text-gray-700">
              Code de l&apos;école
            </label>
            <input
              id="code_ecole"
              name="code_ecole"
              type="text"
              placeholder="ex. college-jang"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
            <p className="text-xs text-gray-500">
              Élèves et parents uniquement (à laisser vide si vous vous connectez avec un email).
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-6 border-t border-gray-100 pt-4 text-center text-sm text-gray-500">
          Vous dirigez une école ?{" "}
          <a href="/inscription" className="font-medium text-gray-900 hover:underline">
            Inscrire mon école
          </a>
        </p>
      </div>
    </main>
  );
}
