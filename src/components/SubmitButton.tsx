"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

// Bouton d'envoi réutilisable : se désactive et affiche un texte différent
// pendant la soumission — évite les doubles clics et confirme visuellement
// que le clic a bien été pris en compte.
export function SubmitButton({
  children,
  pendingText,
  className,
}: {
  children: ReactNode;
  pendingText: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-green-500/50"
      }
    >
      {pending ? pendingText : children}
    </button>
  );
}
