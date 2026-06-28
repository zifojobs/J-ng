import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";
import { destinatairesAutorises, libelleRole } from "@/lib/destinataires";
import { envoyerMessage } from "../actions";

type Personne = {
  id: string;
  prenom: string;
  nom: string;
  role: string;
};

type Message = {
  id: string;
  contenu: string;
  created_at: string;
  expediteur_id: string;
};

// Affiche une date/heure courte (ex. « 26/06 14:30 »).
function quand(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ autreId: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { supabase, profil } = await requireProfil();

  const { autreId } = await params;
  const { erreur } = await searchParams;

  // L'autre personne (la RLS garantit qu'elle est de la même école).
  const { data: autre } = await supabase
    .from("profils")
    .select("id, prenom, nom, role")
    .eq("id", autreId)
    .single<Personne>();

  if (!autre) {
    redirect("/messages");
  }

  // Droit d'écrire : soit la personne est autorisée, soit une conversation existe déjà.
  const autorises = await destinatairesAutorises(supabase, profil);
  let peutEcrire = autorises.some((d) => d.id === autreId);

  // Marque comme lus les messages reçus de cette personne.
  await supabase
    .from("messages")
    .update({ lu: true })
    .eq("destinataire_id", profil.id)
    .eq("expediteur_id", autreId)
    .eq("lu", false);

  // Le fil complet avec cette personne (du plus ancien au plus récent).
  const { data: messages } = await supabase
    .from("messages")
    .select("id, contenu, created_at, expediteur_id")
    .or(
      `and(expediteur_id.eq.${profil.id},destinataire_id.eq.${autreId}),` +
        `and(expediteur_id.eq.${autreId},destinataire_id.eq.${profil.id})`
    )
    .order("created_at", { ascending: true })
    .returns<Message[]>();

  // Si pas explicitement autorisé mais une conversation existe, on autorise la réponse.
  if (!peutEcrire && messages && messages.length > 0) {
    peutEcrire = true;
  }

  // Ni autorisé, ni de conversation existante : on renvoie à la liste.
  if (!peutEcrire) {
    redirect("/messages/nouveau");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col bg-slate-900 px-4 py-8 sm:px-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {autre.prenom} {autre.nom}
          </h1>
          <p className="text-sm text-slate-400">{libelleRole(autre.role)}</p>
        </div>
        <Link
          href="/messages"
          className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          ← Retour
        </Link>
      </header>

      {erreur ? (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {erreur}
        </p>
      ) : null}

      {/* Le fil de la discussion */}
      <section className="mb-6 flex flex-1 flex-col gap-3">
        {!messages || messages.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-800/30 px-4 py-3 text-sm text-slate-400">
            Aucun message. Écrivez le premier ci-dessous.
          </p>
        ) : (
          messages.map((m) => {
            const deMoi = m.expediteur_id === profil.id;
            return (
              <div
                key={m.id}
                className={"flex " + (deMoi ? "justify-end" : "justify-start")}
              >
                <div
                  className={
                    "max-w-[80%] rounded-2xl px-4 py-2 " +
                    (deMoi
                      ? "bg-green-500 text-slate-900"
                      : "border border-slate-700 bg-slate-800/60 text-slate-100")
                  }
                >
                  <p className="whitespace-pre-wrap text-sm">{m.contenu}</p>
                  <p
                    className={
                      "mt-1 text-right text-[11px] " +
                      (deMoi ? "text-slate-900/60" : "text-slate-500")
                    }
                  >
                    {quand(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Zone de réponse */}
      <form action={envoyerMessage} className="sticky bottom-0 flex flex-col gap-2 bg-slate-900 pt-2">
        <input type="hidden" name="destinataire_id" value={autre.id} />
        <textarea
          name="contenu"
          rows={2}
          required
          maxLength={2000}
          placeholder="Votre message…"
          className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        />
        <div className="flex justify-end">
          <button className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400">
            Envoyer
          </button>
        </div>
      </form>
    </main>
  );
}
