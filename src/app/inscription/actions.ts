"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Enregistre une demande d'inscription d'école (formulaire public, sans compte).
export async function envoyerDemande(formData: FormData) {
  const nomEcole = String(formData.get("nom_ecole") ?? "").trim();
  const prenom = String(formData.get("contact_prenom") ?? "").trim();
  const nom = String(formData.get("contact_nom") ?? "").trim();
  const email = String(formData.get("contact_email") ?? "").trim().toLowerCase();
  const telephone = String(formData.get("contact_telephone") ?? "").trim();
  const ville = String(formData.get("ville") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const echec = (msg: string) =>
    redirect("/inscription?erreur=" + encodeURIComponent(msg));

  if (!nomEcole || !prenom || !nom || !email) {
    echec("Merci de remplir le nom de l'école et vos coordonnées.");
  }
  if (!email.includes("@")) echec("L'adresse email ne semble pas valide.");

  // Client anonyme (visiteur non connecté) : la RLS autorise l'insertion d'une
  // demande « en_attente ».
  const supabase = await createClient();
  const { error } = await supabase.from("demandes_inscription").insert({
    nom_ecole: nomEcole,
    contact_prenom: prenom,
    contact_nom: nom,
    contact_email: email,
    contact_telephone: telephone || null,
    ville: ville || null,
    message: message || null,
  });

  if (error) {
    echec("Impossible d'envoyer la demande pour le moment. Réessayez plus tard.");
  }

  redirect("/inscription?succes=1");
}
