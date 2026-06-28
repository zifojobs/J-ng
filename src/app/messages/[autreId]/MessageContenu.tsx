// Affiche le contenu d'un message en rendant les liens cliquables et jolis.
// - Si tout le message est un seul lien → on montre une petite carte (aperçu).
// - Sinon → le texte est conservé, les liens dedans deviennent cliquables.

// Découpe un texte en morceaux : du texte simple ou un lien.
type Morceau = { type: "texte"; valeur: string } | { type: "lien"; url: string };

const REGEX_URL = /(https?:\/\/[^\s]+)/g;

function decouper(texte: string): Morceau[] {
  const morceaux: Morceau[] = [];
  let dernierIndex = 0;
  for (const correspondance of texte.matchAll(REGEX_URL)) {
    const debut = correspondance.index ?? 0;
    if (debut > dernierIndex) {
      morceaux.push({ type: "texte", valeur: texte.slice(dernierIndex, debut) });
    }
    morceaux.push({ type: "lien", url: correspondance[0] });
    dernierIndex = debut + correspondance[0].length;
  }
  if (dernierIndex < texte.length) {
    morceaux.push({ type: "texte", valeur: texte.slice(dernierIndex) });
  }
  return morceaux;
}

// Renvoie le nom du site (ex. « www.anthropic.com ») et un chemin court à afficher.
function decrireLien(url: string): { site: string; chemin: string } {
  try {
    const u = new URL(url);
    const chemin = (u.pathname + u.search).replace(/\/$/, "");
    return { site: u.hostname, chemin: chemin === "" ? "" : chemin };
  } catch {
    return { site: url, chemin: "" };
  }
}

// Une carte d'aperçu quand le message est un lien seul.
function CarteLien({ url, deMoi }: { url: string; deMoi: boolean }) {
  const { site, chemin } = decrireLien(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "flex items-center gap-3 rounded-xl border px-3 py-2 transition " +
        (deMoi
          ? "border-slate-900/20 bg-slate-900/10 hover:bg-slate-900/15"
          : "border-slate-700 bg-slate-900/40 hover:bg-slate-900/60")
      }
    >
      <span
        className={
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base " +
          (deMoi ? "bg-slate-900/15 text-slate-900" : "bg-green-500/15 text-green-400")
        }
        aria-hidden
      >
        🌐
      </span>
      <span className="min-w-0">
        <span
          className={
            "block truncate text-sm font-semibold " +
            (deMoi ? "text-slate-900" : "text-slate-100")
          }
        >
          {site}
        </span>
        {chemin ? (
          <span
            className={
              "block truncate text-xs " +
              (deMoi ? "text-slate-900/60" : "text-slate-400")
            }
          >
            {chemin}
          </span>
        ) : null}
      </span>
    </a>
  );
}

export function MessageContenu({
  contenu,
  deMoi,
}: {
  contenu: string;
  deMoi: boolean;
}) {
  // Message qui est uniquement un lien → carte d'aperçu.
  const seulLien = contenu.trim();
  if (/^https?:\/\/[^\s]+$/.test(seulLien)) {
    return <CarteLien url={seulLien} deMoi={deMoi} />;
  }

  const morceaux = decouper(contenu);
  const styleLien = deMoi
    ? "font-medium text-slate-900 underline decoration-slate-900/40 underline-offset-2 hover:decoration-slate-900"
    : "font-medium text-green-400 underline decoration-green-400/40 underline-offset-2 hover:text-green-300";

  return (
    <p className="whitespace-pre-wrap break-words text-sm">
      {morceaux.map((m, i) =>
        m.type === "lien" ? (
          <a
            key={i}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styleLien}
          >
            {m.url}
          </a>
        ) : (
          <span key={i}>{m.valeur}</span>
        )
      )}
    </p>
  );
}
