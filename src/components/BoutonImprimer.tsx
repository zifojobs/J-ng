"use client";

// Bouton qui ouvre la fenêtre d'impression du navigateur.
// Sur téléphone comme sur ordinateur, l'utilisateur peut alors choisir
// « Enregistrer en PDF ». Caché à l'impression (print:hidden).
export function BoutonImprimer({ children }: { children?: React.ReactNode }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800 print:hidden"
    >
      {children ?? "Imprimer / Enregistrer en PDF"}
    </button>
  );
}
