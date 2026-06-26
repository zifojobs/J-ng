import Link from "next/link";
import { envoyerDemande } from "./actions";

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; succes?: string }>;
}) {
  const { erreur, succes } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Inscrire mon école</h1>
        <p className="mb-6 text-sm text-gray-500">
          Remplissez ce formulaire : nous vous recontacterons pour activer votre espace Jàng.
        </p>

        {succes ? (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
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
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {erreur}
              </p>
            ) : null}

            <form action={envoyerDemande} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Nom de l&apos;école
                </label>
                <input
                  name="nom_ecole"
                  required
                  placeholder="Collège Jàng de Dakar"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Votre prénom</label>
                <input
                  name="contact_prenom"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Votre nom</label>
                <input
                  name="contact_nom"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  name="contact_email"
                  type="email"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Téléphone (facultatif)
                </label>
                <input
                  name="contact_telephone"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Ville (facultatif)
                </label>
                <input
                  name="ville"
                  placeholder="Dakar"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Message (facultatif)
                </label>
                <textarea
                  name="message"
                  rows={3}
                  maxLength={1000}
                  placeholder="Parlez-nous de votre établissement…"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex items-center justify-between sm:col-span-2">
                <Link href="/login" className="text-sm text-gray-500 hover:underline">
                  ← Connexion
                </Link>
                <button className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800">
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
