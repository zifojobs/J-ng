import Link from "next/link";
import { requireProfil } from "@/lib/auth";
import { destinatairesAutorises, libelleRole } from "@/lib/destinataires";

export default async function NouveauMessagePage() {
  const { supabase, profil } = await requireProfil();

  const destinataires = await destinatairesAutorises(supabase, profil);

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau message</h1>
          <p className="text-sm text-gray-500">Choisissez la personne à contacter</p>
        </div>
        <Link
          href="/messages"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Retour
        </Link>
      </header>

      {destinataires.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucune personne à contacter pour le moment.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {destinataires.map((d) => (
            <li key={d.id}>
              <Link
                href={"/messages/" + d.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">
                  {d.prenom} {d.nom}{" "}
                  <span className="text-sm font-normal text-gray-400">
                    · {libelleRole(d.role)}
                  </span>
                </span>
                <span className="text-sm text-gray-400">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
