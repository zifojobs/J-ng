"use client";

import { useState } from "react";
import { login } from "./actions";

// Formulaire de connexion avec deux onglets :
// - « Email » : pour les admins et les professeurs (champ identifiant = email).
// - « Matricule » : pour les élèves et parents (matricule + code de l'école).
// La logique serveur (action `login`) reste inchangée : elle lit toujours
// les champs `identifiant`, `code_ecole` et `password`.
export default function FormulaireConnexion({ erreur }: { erreur?: string }) {
  const [onglet, setOnglet] = useState<"email" | "matricule">("email");
  const [voirMdp, setVoirMdp] = useState(false);

  const champBase =
    "w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20";

  return (
    <form action={login} className="flex flex-col gap-4">
      {/* Onglets Email / Matricule (segmented control) */}
      <div className="flex rounded-xl bg-slate-800/60 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setOnglet("email")}
          className={`flex-1 rounded-lg py-2 transition ${
            onglet === "email"
              ? "bg-green-500 text-slate-900"
              : "text-slate-300 hover:text-white"
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setOnglet("matricule")}
          className={`flex-1 rounded-lg py-2 transition ${
            onglet === "matricule"
              ? "bg-green-500 text-slate-900"
              : "text-slate-300 hover:text-white"
          }`}
        >
          Matricule
        </button>
      </div>

      {erreur ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erreur}
        </p>
      ) : null}

      {/* Onglet Email : admins et professeurs */}
      {onglet === "email" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="identifiant" className="text-sm font-medium text-slate-200">
            Adresse e-mail
          </label>
          <input
            id="identifiant"
            name="identifiant"
            type="email"
            required
            autoComplete="username"
            placeholder="prenom.nom@exemple.com"
            className={champBase}
          />
        </div>
      ) : (
        // Onglet Matricule : élèves et parents
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="identifiant_mat" className="text-sm font-medium text-slate-200">
              Matricule
            </label>
            <input
              id="identifiant_mat"
              name="identifiant"
              type="text"
              required
              autoComplete="username"
              placeholder="ex. 2024-3A-018"
              className={champBase}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code_ecole" className="text-sm font-medium text-slate-200">
              Code de l&apos;école
            </label>
            <input
              id="code_ecole"
              name="code_ecole"
              type="text"
              placeholder="ex. college-jang"
              className={champBase}
            />
          </div>
        </>
      )}

      {/* Mot de passe (commun aux deux onglets) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-slate-200">
            Mot de passe
          </label>
          <button
            type="button"
            onClick={() => setVoirMdp((v) => !v)}
            className="text-xs font-medium text-green-400 hover:text-green-300"
          >
            {voirMdp ? "Masquer" : "Afficher"}
          </button>
        </div>
        <input
          id="password"
          name="password"
          type={voirMdp ? "text" : "password"}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={champBase}
        />
      </div>

      <button
        type="submit"
        className="mt-2 rounded-xl bg-green-500 px-4 py-3 font-semibold text-slate-900 transition hover:bg-green-400 active:bg-green-600"
      >
        Se connecter
      </button>
    </form>
  );
}
