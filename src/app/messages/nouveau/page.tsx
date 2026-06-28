import Link from "next/link";
import { requireProfil } from "@/lib/auth";
import { destinatairesAutorises, libelleRole } from "@/lib/destinataires";

export default async function NouveauMessagePage() {
  const { supabase, profil } = await requireProfil();

  const destinataires = await destinatairesAutorises(supabase, profil);

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Nouveau message</h1>
            <p className="text-sm text-slate-400">Choisissez la personne à contacter</p>
          </div>
          <Link
            href="/messages"
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Retour
          </Link>
        </header>

        {destinataires.length === 0 ? (
          <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Aucune personne à contacter pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
            {destinataires.map((d) => (
              <li key={d.id}>
                <Link
                  href={"/messages/" + d.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-800/60"
                >
                  <span className="font-medium text-white">
                    {d.prenom} {d.nom}{" "}
                    <span className="text-sm font-normal text-slate-500">
                      · {libelleRole(d.role)}
                    </span>
                  </span>
                  <span className="text-sm text-slate-500">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
