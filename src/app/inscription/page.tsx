import Link from "next/link";
import { envoyerDemande } from "./actions";

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; succes?: string }>;
}) {
  const { erreur, succes } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
        <h1 className="mb-1 text-2xl font-bold text-white">Inscrire mon école</h1>
        <p className="mb-6 text-sm text-slate-400">
          Remplissez ce formulaire : nous vous recontacterons pour activer votre espace Jàng.
        </p>

        {succes ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            <p className="font-medium">Demande envoyée. Merci !</p>
            <p className="mt-1">
              Nous vous contacterons bientôt à l&apos;adresse indiquée.
            </p>
            <Link href="/login" className="mt-3 inline-block font-medium underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            {erreur ? (
              <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {erreur}
              </p>
            ) : null}

            <form action={envoyerDemande} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-slate-300">
                  Nom de l&apos;école
                </label>
                <input
                  name="nom_ecole"
                  required
                  placeholder="Collège Jàng de Dakar"
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">Votre prénom</label>
                <input
                  name="contact_prenom"
                  required
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">Votre nom</label>
                <input
                  name="contact_nom"
                  required
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <input
                  name="contact_email"
                  type="email"
                  required
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">
                  Téléphone (facultatif)
                </label>
                <input
                  name="contact_telephone"
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-slate-300">
                  Ville (facultatif)
                </label>
                <input
                  name="ville"
                  placeholder="Dakar"
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-slate-300">
                  Message (facultatif)
                </label>
                <textarea
                  name="message"
                  rows={3}
                  maxLength={1000}
                  placeholder="Parlez-nous de votre établissement…"
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex items-center justify-between sm:col-span-2">
                <Link href="/login" className="text-sm text-slate-400 hover:underline">
                  ← Connexion
                </Link>
                <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
                  Envoyer la demande
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
