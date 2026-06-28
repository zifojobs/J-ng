import Link from "next/link";
import { requireProfil } from "@/lib/auth";
import { libelleRole } from "@/lib/destinataires";

type Personne = { prenom: string; nom: string; role: string } | null;

type Message = {
  id: string;
  contenu: string;
  lu: boolean;
  created_at: string;
  expediteur_id: string;
  destinataire_id: string;
  expediteur: Personne;
  destinataire: Personne;
};

// Une conversation = le dernier message échangé avec une personne + le nombre
// de messages non lus reçus d'elle.
type Conversation = {
  autreId: string;
  autre: Personne;
  dernier: Message;
  nonLus: number;
};

export default async function MessagesPage() {
  const { supabase, profil } = await requireProfil();

  const retourHref = profil.role === "admin_ecole" ? "/ecole" : "/espace";

  // Tous mes messages (envoyés ou reçus), le plus récent d'abord.
  const { data: messages } = await supabase
    .from("messages")
    .select(
      "id, contenu, lu, created_at, expediteur_id, destinataire_id, " +
        "expediteur:profils!messages_expediteur_id_fkey ( prenom, nom, role ), " +
        "destinataire:profils!messages_destinataire_id_fkey ( prenom, nom, role )"
    )
    .order("created_at", { ascending: false })
    .returns<Message[]>();

  // On regroupe par « autre personne ». Comme la liste est déjà triée du plus
  // récent au plus ancien, le premier message vu pour une personne est le dernier échangé.
  const parPersonne = new Map<string, Conversation>();
  for (const m of messages ?? []) {
    const jeSuisExpediteur = m.expediteur_id === profil.id;
    const autreId = jeSuisExpediteur ? m.destinataire_id : m.expediteur_id;
    const autre = jeSuisExpediteur ? m.destinataire : m.expediteur;

    const conv = parPersonne.get(autreId);
    if (!conv) {
      parPersonne.set(autreId, { autreId, autre, dernier: m, nonLus: 0 });
    }
    // Message reçu et non lu -> on incrémente le compteur.
    if (!jeSuisExpediteur && !m.lu) {
      parPersonne.get(autreId)!.nonLus += 1;
    }
  }
  const conversations = [...parPersonne.values()];

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <p className="text-sm text-slate-400">
              {profil.prenom} {profil.nom}
            </p>
          </div>
          <Link
            href={retourHref}
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Retour
          </Link>
        </header>

        <div className="mb-6">
          <Link
            href="/messages/nouveau"
            className="inline-block rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400"
          >
            Nouveau message
          </Link>
        </div>

        {conversations.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-800/30 px-4 py-3 text-sm text-slate-400">
            Aucune conversation pour le moment. Commencez-en une avec « Nouveau message ».
          </p>
        ) : (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
            {conversations.map((c) => (
              <li key={c.autreId}>
                <Link
                  href={"/messages/" + c.autreId}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-800/60"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {c.autre ? `${c.autre.prenom} ${c.autre.nom}` : "—"}{" "}
                      <span className="text-sm font-normal text-slate-500">
                        · {c.autre ? libelleRole(c.autre.role) : ""}
                      </span>
                    </p>
                    <p className="truncate text-sm text-slate-400">
                      {c.dernier.expediteur_id === profil.id ? "Vous : " : ""}
                      {c.dernier.contenu}
                    </p>
                  </div>
                  {c.nonLus > 0 ? (
                    <span className="shrink-0 rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-semibold text-slate-900">
                      {c.nonLus}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
