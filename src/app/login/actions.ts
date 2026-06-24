"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emailTechnique } from "@/lib/identifiants";

// Connexion :
// - admins et profs se connectent avec leur email (contient « @ ») ;
// - élèves et parents se connectent avec leur matricule + le code de leur école,
//   transformés en email technique (identique à celui créé à l'inscription).
export async function login(formData: FormData) {
  const supabase = await createClient();

  const identifiant = String(formData.get("identifiant") ?? "").trim();
  const codeEcole = String(formData.get("code_ecole") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let email: string;
  if (identifiant.includes("@")) {
    // C'est un vrai email (admin, professeur).
    email = identifiant.toLowerCase();
  } else {
    // C'est un matricule : il faut le code de l'école pour reconstruire l'email.
    if (!codeEcole) {
      redirect("/login?erreur=" + encodeURIComponent("Pour un matricule, indiquez aussi le code de votre école."));
    }
    email = emailTechnique(identifiant, codeEcole);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // On renvoie vers la page de connexion avec un message d'erreur en français.
    redirect("/login?erreur=Email%20ou%20mot%20de%20passe%20incorrect");
  }

  redirect("/");
}

// Déconnexion.
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
