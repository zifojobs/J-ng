"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Connexion par email + mot de passe.
export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

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
